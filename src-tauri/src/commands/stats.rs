use crate::models::{CsvData, StatsResult};

fn parse_numeric(vals: &[String]) -> Vec<f64> {
    vals.iter()
        .filter(|v| !v.is_empty())
        .filter_map(|v| v.parse::<f64>().ok())
        .collect()
}

pub fn compute_stats_for_column(data: &CsvData, column: &str) -> StatsResult {
    let vals: Vec<String> = data.rows.iter()
        .map(|r| r.get(column).cloned().unwrap_or_default())
        .collect();

    let mut nums = parse_numeric(&vals);
    if nums.is_empty() {
        return StatsResult { column: column.to_string(), count: 0, sum: None, mean: None,
            median: None, mode: None, min: None, max: None, std_dev: None, variance: None,
            range: None, q1: None, q3: None, iqr: None, skewness: None };
    }

    nums.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let n = nums.len() as f64;
    let sum: f64 = nums.iter().sum();
    let mean = sum / n;

    let median = if nums.len() % 2 == 0 {
        (nums[nums.len() / 2 - 1] + nums[nums.len() / 2]) / 2.0
    } else {
        nums[nums.len() / 2]
    };

    let variance = nums.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / n;
    let std_dev = variance.sqrt();
    let q1 = nums[(nums.len() as f64 * 0.25) as usize];
    let q3 = nums[(nums.len() as f64 * 0.75) as usize];
    let iqr = q3 - q1;

    let skewness = if std_dev > 0.0 {
        nums.iter().map(|v| ((v - mean) / std_dev).powi(3)).sum::<f64>() / n
    } else { 0.0 };

    let mut freq: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for v in &nums { *freq.entry(format!("{:.4}", v)).or_insert(0) += 1; }
    let mode = freq.into_iter().max_by_key(|(_, c)| *c).map(|(v, _)| v);

    let round4 = |v: f64| (v * 10000.0).round() / 10000.0;

    StatsResult {
        column: column.to_string(), count: nums.len(),
        sum: Some(round4(sum)), mean: Some(round4(mean)), median: Some(round4(median)),
        mode, min: Some(nums[0]), max: Some(*nums.last().unwrap()),
        std_dev: Some(round4(std_dev)), variance: Some(round4(variance)),
        range: Some(round4(nums.last().unwrap() - nums[0])),
        q1: Some(round4(q1)), q3: Some(round4(q3)), iqr: Some(round4(iqr)),
        skewness: Some(round4(skewness)),
    }
}

#[tauri::command]
pub async fn compute_column_stats(data: CsvData, column: String) -> Result<StatsResult, String> {
    Ok(compute_stats_for_column(&data, &column))
}

#[tauri::command]
pub async fn compute_all_stats(data: CsvData) -> Result<Vec<StatsResult>, String> {
    let results = data.headers.iter()
        .map(|col| compute_stats_for_column(&data, col))
        .filter(|s| s.count > 0)
        .collect();
    Ok(results)
}
