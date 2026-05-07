use crate::models::{CsvData, FuzzyDuplicate};
use strsim::normalized_levenshtein;

#[tauri::command]
pub async fn find_fuzzy_duplicates(data: CsvData, threshold: Option<f64>) -> Result<Vec<FuzzyDuplicate>, String> {
    let threshold = threshold.unwrap_or(0.85);
    let mut results = Vec::new();

    let text_cols: Vec<String> = data.headers.iter()
        .filter(|h| {
            let vals: Vec<String> = data.rows.iter().take(50)
                .map(|r| r.get(*h).cloned().unwrap_or_default())
                .collect();
            let non_num = vals.iter().filter(|v| !v.is_empty() && v.parse::<f64>().is_err()).count();
            non_num > vals.len() / 2
        })
        .cloned()
        .collect();

    if text_cols.is_empty() {
        return Ok(vec![]);
    }

    let limit = data.rows.len().min(300);

    for i in 0..limit {
        for j in (i + 1)..limit {
            let mut matched_cols = Vec::new();
            let mut total_sim = 0.0;

            for col in &text_cols {
                let a = data.rows[i].get(col).map(|s| s.as_str()).unwrap_or("");
                let b = data.rows[j].get(col).map(|s| s.as_str()).unwrap_or("");
                if !a.is_empty() && !b.is_empty() {
                    let sim = normalized_levenshtein(a, b);
                    if sim >= threshold {
                        matched_cols.push(col.clone());
                        total_sim += sim;
                    }
                }
            }

            let required = ((text_cols.len() as f64) * 0.6).ceil() as usize;
            if matched_cols.len() >= required {
                let avg_sim = total_sim / text_cols.len() as f64;
                if avg_sim >= threshold {
                    results.push(FuzzyDuplicate {
                        row1_index: i, row2_index: j,
                        similarity: (avg_sim * 1000.0).round() / 10.0,
                        matched_columns: matched_cols,
                        row1_data: data.rows[i].clone(),
                        row2_data: data.rows[j].clone(),
                    });
                }
            }
        }
    }

    results.sort_by(|a, b| b.similarity.partial_cmp(&a.similarity).unwrap());
    Ok(results)
}
