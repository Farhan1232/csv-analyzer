use crate::models::CsvData;
use std::collections::HashMap;
use std::fs;

#[tauri::command]
pub async fn parse_csv_file(path: String) -> Result<CsvData, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let file_size = metadata.len();
    let file_name = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.csv")
        .to_string();
    parse_csv_content(content, path, file_name, file_size)
}

#[tauri::command]
pub async fn parse_csv_string(content: String, file_name: String) -> Result<CsvData, String> {
    let file_size = content.len() as u64;
    parse_csv_content(content, file_name.clone(), file_name, file_size)
}

fn parse_csv_content(content: String, file_path: String, file_name: String, file_size: u64) -> Result<CsvData, String> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .trim(csv::Trim::All)
        .from_reader(content.as_bytes());

    let headers: Vec<String> = reader
        .headers()
        .map_err(|e| e.to_string())?
        .iter()
        .map(|h| h.to_string())
        .collect();

    let mut rows: Vec<HashMap<String, String>> = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|e| e.to_string())?;
        let mut row = HashMap::new();
        for (i, header) in headers.iter().enumerate() {
            row.insert(header.clone(), record.get(i).unwrap_or("").to_string());
        }
        rows.push(row);
    }

    let total_rows = rows.len();
    Ok(CsvData { headers, rows, total_rows, file_path, file_name, file_size })
}
