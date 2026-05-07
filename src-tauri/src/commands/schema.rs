use crate::models::{CsvData, SchemaOutput};
use crate::commands::profile::profile_csv;
use serde_json::json;

#[tauri::command]
pub async fn generate_schema(data: CsvData, table_name: Option<String>) -> Result<SchemaOutput, String> {
    let table = table_name.unwrap_or_else(|| "my_table".to_string());
    let profile = profile_csv(data).await?;

    // SQL
    let sql_type = |dtype: &str| match dtype {
        "integer" => "INTEGER",
        "float"   => "DECIMAL(18,4)",
        "boolean" => "BOOLEAN",
        "date"    => "DATE",
        "datetime" => "TIMESTAMP",
        "email"   => "VARCHAR(255)",
        "phone"   => "VARCHAR(20)",
        "url"     => "TEXT",
        "ip_address" => "VARCHAR(45)",
        "credit_card" => "VARCHAR(20)",
        "ssn"     => "VARCHAR(11)",
        _         => "TEXT",
    };

    let sql_cols: Vec<String> = profile.columns.iter().map(|c| {
        let not_null = if c.null_count == 0 { " NOT NULL" } else { "" };
        format!("  {} {}{}", c.name, sql_type(&c.data_type), not_null)
    }).collect();
    let sql = format!("CREATE TABLE {} (\n  id SERIAL PRIMARY KEY,\n{}\n);", table, sql_cols.join(",\n"));

    // JSON Schema
    let properties: serde_json::Map<String, serde_json::Value> = profile.columns.iter().map(|c| {
        let t = match c.data_type.as_str() {
            "integer" => "integer",
            "float"   => "number",
            "boolean" => "boolean",
            _         => "string",
        };
        (c.name.clone(), json!({ "type": t, "description": format!("{} field", c.data_type) }))
    }).collect();
    let required: Vec<&str> = profile.columns.iter().filter(|c| c.null_count == 0).map(|c| c.name.as_str()).collect();
    let json_schema_val = json!({
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": table, "type": "object",
        "properties": properties,
        "required": required
    });
    let json_schema = serde_json::to_string_pretty(&json_schema_val).unwrap_or_default();

    // Rust struct
    let rust_type = |dtype: &str, nullable: bool| {
        let inner = match dtype {
            "integer" => "i64",
            "float"   => "f64",
            "boolean" => "bool",
            _         => "String",
        };
        if nullable { format!("Option<{}>", inner) } else { inner.to_string() }
    };
    let rust_fields: Vec<String> = profile.columns.iter().map(|c| {
        let safe_name = c.name.to_lowercase().replace(|ch: char| !ch.is_alphanumeric() && ch != '_', "_");
        format!("    pub {}: {},", safe_name, rust_type(&c.data_type, c.null_percent > 0.0))
    }).collect();
    let struct_name = {
        let mut s = table.clone();
        if let Some(c) = s.get_mut(0..1) { c.make_ascii_uppercase(); }
        s
    };
    let rust_struct = format!("use serde::{{Deserialize, Serialize}};\n\n#[derive(Debug, Serialize, Deserialize)]\npub struct {} {{\n{}\n}}", struct_name, rust_fields.join("\n"));

    // TypeScript
    let ts_type = |dtype: &str| match dtype {
        "integer" | "float" => "number",
        "boolean" => "boolean",
        _ => "string",
    };
    let ts_fields: Vec<String> = profile.columns.iter().map(|c| {
        let opt = if c.null_percent > 0.0 { "?" } else { "" };
        format!("  {}{}: {};", c.name, opt, ts_type(&c.data_type))
    }).collect();
    let typescript = format!("export interface {} {{\n{}\n}}", struct_name, ts_fields.join("\n"));

    Ok(SchemaOutput { sql, json_schema, rust_struct, typescript })
}
