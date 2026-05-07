use crate::models::{CsvData, PiiResult};
use regex::Regex;

fn get_pii_type(value: &str) -> Option<&'static str> {
    let email_re    = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    let phone_re    = Regex::new(r"^[\+]?[\d\s\-\(\)]{7,15}$").unwrap();
    let cc_re       = Regex::new(r"^\d{13,19}$").unwrap();
    let ssn_re      = Regex::new(r"^\d{3}-\d{2}-\d{4}$").unwrap();
    let ip_re       = Regex::new(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$").unwrap();

    if email_re.is_match(value) { return Some("email"); }
    if ssn_re.is_match(value)   { return Some("ssn"); }
    if cc_re.is_match(value)    { return Some("credit_card"); }
    if ip_re.is_match(value)    { return Some("ip_address"); }
    if phone_re.is_match(value) { return Some("phone"); }
    None
}

fn mask(value: &str, pii_type: &str) -> String {
    match pii_type {
        "email" => {
            if let Some(at) = value.find('@') {
                format!("{}***{}", &value[..1], &value[at..])
            } else {
                "***@***.com".to_string()
            }
        }
        "phone"       => value.chars().enumerate().map(|(i, c)| if c.is_ascii_digit() && i < value.len() - 4 { '*' } else { c }).collect(),
        "credit_card" => format!("****-****-****-{}", &value[value.len().saturating_sub(4)..]),
        "ssn"         => format!("***-**-{}", value.split('-').last().unwrap_or("****")),
        "ip_address"  => {
            let parts: Vec<&str> = value.split('.').collect();
            format!("***.***.{}.{}", parts.get(2).unwrap_or(&"*"), parts.get(3).unwrap_or(&"*"))
        }
        _ => "***MASKED***".to_string(),
    }
}

#[tauri::command]
pub async fn detect_pii(data: CsvData) -> Result<Vec<PiiResult>, String> {
    let mut results = Vec::new();
    for (i, row) in data.rows.iter().enumerate() {
        for col in &data.headers {
            let value = row.get(col).map(|s| s.as_str()).unwrap_or("");
            if value.is_empty() { continue; }
            if let Some(pii_type) = get_pii_type(value) {
                results.push(PiiResult {
                    row_index: i, column: col.clone(),
                    value: value.to_string(), pii_type: pii_type.to_string(),
                    masked: mask(value, pii_type),
                });
            }
        }
    }
    Ok(results)
}

#[tauri::command]
pub async fn mask_pii(mut data: CsvData) -> Result<CsvData, String> {
    for row in data.rows.iter_mut() {
        for col in data.headers.iter() {
            let value = row.get(col).cloned().unwrap_or_default();
            if let Some(pii_type) = get_pii_type(&value) {
                row.insert(col.clone(), mask(&value, pii_type));
            }
        }
    }
    Ok(data)
}
