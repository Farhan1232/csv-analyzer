use crate::models::{CsvData, AnomalyResult};

#[tauri::command]
pub async fn detect_anomalies(data: CsvData, threshold: Option<f64>) -> Result<Vec<AnomalyResult>, String> {
    let threshold = threshold.unwrap_or(3.0);
    let mut results = Vec::new();

    for col in &data.headers {
        let vals: Vec<(usize, f64, String)> = data.rows.iter().enumerate()
            .filter_map(|(i, r)| {
                let raw = r.get(col).cloned().unwrap_or_default();
                raw.parse::<f64>().ok().map(|v| (i, v, raw))
            })
            .collect();

        if vals.len() < 5 { continue; }

        let nums: Vec<f64> = vals.iter().map(|(_, v, _)| *v).collect();
        let n = nums.len() as f64;
        let mean = nums.iter().sum::<f64>() / n;
        let std = (nums.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / n).sqrt();

        let mut sorted = nums.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let q1 = sorted[(n * 0.25) as usize];
        let q3 = sorted[(n * 0.75) as usize];
        let iqr = q3 - q1;

        for (idx, val, raw) in &vals {
            let z = if std > 0.0 { ((val - mean) / std).abs() } else { 0.0 };
            let is_iqr = *val < q1 - 1.5 * iqr || *val > q3 + 1.5 * iqr;

            if z > threshold || is_iqr {
                results.push(AnomalyResult {
                    row_index: *idx, column: col.clone(), value: raw.clone(),
                    score: (z * 100.0).round() / 100.0,
                    method: if z > threshold { "zscore" } else { "iqr" }.to_string(),
                    severity: if z > 5.0 { "high" } else if z > 4.0 { "medium" } else { "low" }.to_string(),
                });
            }
        }
    }

    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    Ok(results)
}
