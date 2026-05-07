use crate::models::CsvData;

#[tauri::command]
pub async fn export_csv(data: CsvData) -> Result<String, String> {
    let mut out = String::new();
    out.push_str(&data.headers.join(","));
    out.push('\n');
    for row in &data.rows {
        let vals: Vec<String> = data.headers.iter().map(|h| {
            let v = row.get(h).cloned().unwrap_or_default();
            if v.contains(',') || v.contains('"') || v.contains('\n') {
                format!("\"{}\"", v.replace('"', "\"\""))
            } else { v }
        }).collect();
        out.push_str(&vals.join(","));
        out.push('\n');
    }
    Ok(out)
}

#[tauri::command]
pub async fn export_json(data: CsvData) -> Result<String, String> {
    serde_json::to_string_pretty(&data.rows).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_sql(data: CsvData, table_name: Option<String>) -> Result<String, String> {
    let table = table_name.unwrap_or_else(|| "my_table".to_string());
    let lines: Vec<String> = data.rows.iter().map(|row| {
        let vals: Vec<String> = data.headers.iter()
            .map(|h| format!("'{}'", row.get(h).cloned().unwrap_or_default().replace('\'', "''")))
            .collect();
        format!("INSERT INTO {} ({}) VALUES ({});", table, data.headers.join(", "), vals.join(", "))
    }).collect();
    Ok(lines.join("\n"))
}

#[tauri::command]
pub async fn export_html(data: CsvData) -> Result<String, String> {
    let headers = data.headers.iter().map(|h| format!("<th>{}</th>", h)).collect::<Vec<_>>().join("");
    let rows = data.rows.iter().map(|row| {
        let cells = data.headers.iter().map(|h| format!("<td>{}</td>", row.get(h).cloned().unwrap_or_default())).collect::<Vec<_>>().join("");
        format!("<tr>{}</tr>", cells)
    }).collect::<Vec<_>>().join("\n");

    Ok(format!(r#"<!DOCTYPE html><html><head><style>
body{{font-family:sans-serif;padding:20px}}
table{{border-collapse:collapse;width:100%}}
th,td{{border:1px solid #ddd;padding:8px}}
th{{background:#0ea5e9;color:white}}
tr:nth-child(even){{background:#f2f2f2}}
</style></head><body><h2>CSV Export</h2>
<table><thead><tr>{}</tr></thead><tbody>{}</tbody></table>
</body></html>"#, headers, rows))
}

#[tauri::command]
pub async fn export_markdown(data: CsvData) -> Result<String, String> {
    let header = format!("| {} |", data.headers.join(" | "));
    let sep = format!("| {} |", data.headers.iter().map(|_| "---").collect::<Vec<_>>().join(" | "));
    let rows: Vec<String> = data.rows.iter().map(|row| {
        format!("| {} |", data.headers.iter().map(|h| row.get(h).cloned().unwrap_or_default()).collect::<Vec<_>>().join(" | "))
    }).collect();
    Ok(std::iter::once(header).chain(std::iter::once(sep)).chain(rows).collect::<Vec<_>>().join("\n"))
}
