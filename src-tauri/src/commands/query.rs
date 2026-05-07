use crate::models::CsvData;
use regex::Regex;

#[tauri::command]
pub async fn nl_query(data: CsvData, query: String) -> Result<CsvData, String> {
    let q = query.to_lowercase().trim().to_string();
    let mut rows = data.rows.clone();

    // "top N by column"
    let top_re = Regex::new(r"top\s+(\d+)\s+by\s+(\w+)").unwrap();
    if let Some(caps) = top_re.captures(&q) {
        let n: usize = caps[1].parse().unwrap_or(10);
        let col_lower = caps[2].to_string();
        if let Some(col) = data.headers.iter().find(|h| h.to_lowercase() == col_lower) {
            rows.sort_by(|a, b| {
                let av = a.get(col).and_then(|v| v.parse::<f64>().ok()).unwrap_or(0.0);
                let bv = b.get(col).and_then(|v| v.parse::<f64>().ok()).unwrap_or(0.0);
                bv.partial_cmp(&av).unwrap()
            });
            rows.truncate(n);
            let total = rows.len();
            return Ok(CsvData { rows, total_rows: total, ..data });
        }
    }

    // "count grouped by column"
    let count_re = Regex::new(r"count.*group(?:ed)?\s+by\s+(\w+)").unwrap();
    if let Some(caps) = count_re.captures(&q) {
        let col_lower = caps[1].to_string();
        if let Some(col) = data.headers.iter().find(|h| h.to_lowercase() == col_lower) {
            let mut freq: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
            for row in &data.rows { *freq.entry(row.get(col).cloned().unwrap_or_default()).or_insert(0) += 1; }
            let mut new_rows: Vec<_> = freq.into_iter().map(|(val, cnt)| {
                let mut m = std::collections::HashMap::new();
                m.insert(col.clone(), val);
                m.insert("count".to_string(), cnt.to_string());
                m
            }).collect();
            new_rows.sort_by(|a, b| {
                let ac: usize = a.get("count").and_then(|v| v.parse().ok()).unwrap_or(0);
                let bc: usize = b.get("count").and_then(|v| v.parse().ok()).unwrap_or(0);
                bc.cmp(&ac)
            });
            let total = new_rows.len();
            return Ok(CsvData { headers: vec![col.clone(), "count".to_string()], rows: new_rows, total_rows: total, ..data });
        }
    }

    // "where col > val"
    let gt_re = Regex::new(r"(\w+)\s*>\s*([\d.]+)").unwrap();
    if let Some(caps) = gt_re.captures(&q) {
        let col_lower = caps[1].to_string();
        let val: f64 = caps[2].parse().unwrap_or(0.0);
        if let Some(col) = data.headers.iter().find(|h| h.to_lowercase() == col_lower) {
            let col = col.clone();
            rows.retain(|r| r.get(&col).and_then(|v| v.parse::<f64>().ok()).unwrap_or(f64::MIN) > val);
        }
    }

    // "where col < val"
    let lt_re = Regex::new(r"(\w+)\s*<\s*([\d.]+)").unwrap();
    if let Some(caps) = lt_re.captures(&q) {
        let col_lower = caps[1].to_string();
        let val: f64 = caps[2].parse().unwrap_or(0.0);
        if let Some(col) = data.headers.iter().find(|h| h.to_lowercase() == col_lower) {
            let col = col.clone();
            rows.retain(|r| r.get(&col).and_then(|v| v.parse::<f64>().ok()).unwrap_or(f64::MAX) < val);
        }
    }

    // "where col is value"
    let eq_re = Regex::new(r"(\w+)\s+is\s+(\w+)").unwrap();
    if let Some(caps) = eq_re.captures(&q) {
        let col_lower = caps[1].to_string();
        let val = caps[2].to_lowercase();
        if let Some(col) = data.headers.iter().find(|h| h.to_lowercase() == col_lower) {
            let col = col.clone();
            rows.retain(|r| r.get(&col).map(|v| v.to_lowercase()) == Some(val.clone()));
        }
    }

    let total = rows.len();
    Ok(CsvData { rows, total_rows: total, ..data })
}
