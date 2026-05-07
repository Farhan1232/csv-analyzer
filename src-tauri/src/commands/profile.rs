use crate::models::{CsvData, ColumnProfile, DataProfile, TopValue};
use chrono::Utc;
use std::collections::{HashMap, HashSet};

fn detect_type(values: &[String]) -> String {
    let non_empty: Vec<&String> = values.iter().filter(|v| !v.is_empty()).collect();
    if non_empty.is_empty() { return "empty".to_string(); }

    let sample: Vec<&String> = non_empty.iter().take(200).copied().collect();
    let n = sample.len() as f64;
    let mut int_c = 0; let mut float_c = 0; let mut bool_c = 0;
    let mut date_c = 0; let mut email_c = 0; let mut phone_c = 0;
    let mut url_c = 0; let mut ip_c = 0; let mut cc_c = 0; let mut ssn_c = 0;

    let email_re    = regex::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    let phone_re    = regex::Regex::new(r"^[\+]?[\d\s\-\(\)]{7,15}$").unwrap();
    let url_re      = regex::Regex::new(r"^https?://").unwrap();
    let ip_re       = regex::Regex::new(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$").unwrap();
    let cc_re       = regex::Regex::new(r"^\d{13,19}$").unwrap();
    let ssn_re      = regex::Regex::new(r"^\d{3}-\d{2}-\d{4}$").unwrap();
    let date_re     = regex::Regex::new(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}").unwrap();
    let bool_vals   = ["true","false","yes","no","1","0","t","f","y","n"];

    for v in &sample {
        let t = v.trim().to_lowercase();
        if v.parse::<i64>().is_ok() { int_c += 1; }
        else if v.parse::<f64>().is_ok() { float_c += 1; }
        if bool_vals.contains(&t.as_str()) { bool_c += 1; }
        if date_re.is_match(v)  { date_c += 1; }
        if email_re.is_match(v) { email_c += 1; }
        if phone_re.is_match(v) { phone_c += 1; }
        if url_re.is_match(v)   { url_c += 1; }
        if ip_re.is_match(v)    { ip_c += 1; }
        if cc_re.is_match(v)    { cc_c += 1; }
        if ssn_re.is_match(v)   { ssn_c += 1; }
    }

    let pct = |c: usize| c as f64 / n;
    if pct(email_c) > 0.8 { return "email".to_string(); }
    if pct(cc_c) > 0.8    { return "credit_card".to_string(); }
    if pct(ssn_c) > 0.8   { return "ssn".to_string(); }
    if pct(phone_c) > 0.8 { return "phone".to_string(); }
    if pct(url_c) > 0.8   { return "url".to_string(); }
    if pct(ip_c) > 0.8    { return "ip_address".to_string(); }
    if pct(date_c) > 0.7  { return "date".to_string(); }
    if pct(bool_c) > 0.9  { return "boolean".to_string(); }
    if pct(int_c) > 0.9   { return "integer".to_string(); }
    if pct(float_c) > 0.7 { return "float".to_string(); }
    "text".to_string()
}

fn detect_pii(dtype: &str) -> Option<String> {
    match dtype {
        "email" | "phone" | "credit_card" | "ssn" | "ip_address" => Some(dtype.to_string()),
        _ => None,
    }
}

#[tauri::command]
pub async fn profile_csv(data: CsvData) -> Result<DataProfile, String> {
    let mut columns = Vec::new();

    for col in &data.headers {
        let vals: Vec<String> = data.rows.iter()
            .map(|r| r.get(col).cloned().unwrap_or_default())
            .collect();

        let non_empty: Vec<&String> = vals.iter().filter(|v| !v.is_empty()).collect();
        let null_count = vals.len() - non_empty.len();
        let unique: HashSet<&String> = non_empty.iter().copied().collect();
        let data_type = detect_type(&vals);
        let pii_type = detect_pii(&data_type);

        let nums: Vec<f64> = non_empty.iter()
            .filter_map(|v| v.parse::<f64>().ok())
            .collect();
        let mut sorted_nums = nums.clone();
        sorted_nums.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let mean = if !nums.is_empty() { Some(nums.iter().sum::<f64>() / nums.len() as f64) } else { None };
        let median = if !sorted_nums.is_empty() {
            let m = sorted_nums.len() / 2;
            if sorted_nums.len() % 2 == 0 { Some((sorted_nums[m-1] + sorted_nums[m]) / 2.0) }
            else { Some(sorted_nums[m]) }
        } else { None };
        let std_dev = mean.map(|m| {
            let var = nums.iter().map(|v| (v - m).powi(2)).sum::<f64>() / nums.len() as f64;
            var.sqrt()
        });

        let has_anomaly = if let (Some(m), Some(sd)) = (mean, std_dev) {
            sd > 0.0 && nums.iter().any(|v| ((v - m) / sd).abs() > 3.0)
        } else { false };

        let mut freq: HashMap<String, usize> = HashMap::new();
        for v in &non_empty { *freq.entry(v.to_string()).or_insert(0) += 1; }
        let mut top_values: Vec<TopValue> = freq.into_iter()
            .map(|(value, count)| TopValue { value, count })
            .collect();
        top_values.sort_by(|a, b| b.count.cmp(&a.count));
        top_values.truncate(5);

        let total_rows = vals.len();
        let unique_count = unique.len();
        let non_empty_count = non_empty.len();

        columns.push(ColumnProfile {
            name: col.clone(), data_type,
            null_count,
            null_percent: if total_rows > 0 { (null_count as f64 / total_rows as f64 * 100.0 * 10.0).round() / 10.0 } else { 0.0 },
            unique_count,
            unique_percent: if non_empty_count > 0 { (unique_count as f64 / non_empty_count as f64 * 100.0 * 10.0).round() / 10.0 } else { 0.0 },
            min: sorted_nums.first().map(|v| v.to_string()),
            max: sorted_nums.last().map(|v| v.to_string()),
            mean: mean.map(|v| (v * 10000.0).round() / 10000.0),
            median: median.map(|v| (v * 10000.0).round() / 10000.0),
            std_dev: std_dev.map(|v| (v * 10000.0).round() / 10000.0),
            top_values,
            sample_values: non_empty.iter().take(3).map(|v| v.to_string()).collect(),
            has_anomaly, has_pii: pii_type.is_some(), pii_type,
        });
    }

    let mut seen: HashSet<String> = HashSet::new();
    let mut dup_count = 0;
    for row in &data.rows {
        let key = serde_json::to_string(row).unwrap_or_default();
        if seen.contains(&key) { dup_count += 1; }
        else { seen.insert(key); }
    }

    let total_nulls: usize = columns.iter().map(|c| c.null_count).sum();
    let null_penalty = if data.total_rows > 0 && !data.headers.is_empty() {
        (total_nulls as f64 / (data.total_rows * data.headers.len()) as f64) * 30.0
    } else { 0.0 };
    let dup_penalty = if data.total_rows > 0 { (dup_count as f64 / data.total_rows as f64) * 20.0 } else { 0.0 };
    let pii_penalty = columns.iter().filter(|c| c.has_pii).count() as f64 * 2.0;
    let health_score = (100.0 - null_penalty - dup_penalty - pii_penalty).max(0.0).round() as u32;

    Ok(DataProfile {
        total_rows: data.total_rows,
        total_columns: data.headers.len(),
        total_nulls, duplicate_rows: dup_count,
        health_score, columns,
        generated_at: Utc::now().to_rfc3339(),
    })
}
