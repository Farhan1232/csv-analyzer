use crate::models::{CsvData, DiffResult, ModifiedCell, DiffSummary};
use std::collections::HashSet;

#[tauri::command]
pub async fn diff_csvs(base: CsvData, compare: CsvData) -> Result<DiffResult, String> {
    let base_keys: HashSet<String> = base.rows.iter()
        .map(|r| serde_json::to_string(r).unwrap_or_default())
        .collect();
    let compare_keys: HashSet<String> = compare.rows.iter()
        .map(|r| serde_json::to_string(r).unwrap_or_default())
        .collect();

    let added_rows: Vec<usize> = compare.rows.iter().enumerate()
        .filter(|(_, r)| !base_keys.contains(&serde_json::to_string(r).unwrap_or_default()))
        .map(|(i, _)| i)
        .collect();

    let deleted_rows: Vec<usize> = base.rows.iter().enumerate()
        .filter(|(_, r)| !compare_keys.contains(&serde_json::to_string(r).unwrap_or_default()))
        .map(|(i, _)| i)
        .collect();

    let mut modified_cells: Vec<ModifiedCell> = Vec::new();
    let min_len = base.rows.len().min(compare.rows.len());
    let common_headers: Vec<&String> = base.headers.iter()
        .filter(|h| compare.headers.contains(h))
        .collect();

    for i in 0..min_len {
        for col in &common_headers {
            let old = base.rows[i].get(*col).cloned().unwrap_or_default();
            let new = compare.rows[i].get(*col).cloned().unwrap_or_default();
            if old != new {
                modified_cells.push(ModifiedCell { row: i, column: (*col).clone(), old_value: old, new_value: new });
            }
        }
    }

    let summary = DiffSummary {
        added: added_rows.len(),
        deleted: deleted_rows.len(),
        modified: modified_cells.len(),
    };

    Ok(DiffResult { added_rows, deleted_rows, modified_cells, summary })
}
