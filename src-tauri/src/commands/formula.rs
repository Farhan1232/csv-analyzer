use crate::models::CsvData;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct FormulaResult {
    pub success: bool,
    pub new_column: String,
    pub rows: Option<Vec<HashMap<String, String>>>,
    pub error: Option<String>,
}

fn evaluate_expr(expr: &str, row: &HashMap<String, String>, headers: &[String]) -> Result<String, String> {
    let mut expr = expr.to_string();

    // Sort headers by length descending to replace longer names first
    let mut sorted_headers = headers.to_vec();
    sorted_headers.sort_by(|a, b| b.len().cmp(&a.len()));

    for col in &sorted_headers {
        let val = row.get(col).cloned().unwrap_or_default();
        let num_val = val.parse::<f64>().ok();
        let replacement = if let Some(n) = num_val { format!("{}", n) } else { format!("\"{}\"", val.replace('"', "\\\"")) };
        expr = expr.replace(col.as_str(), &replacement);
    }

    // Basic arithmetic evaluator
    evaluate_arithmetic(&expr)
}

fn evaluate_arithmetic(expr: &str) -> Result<String, String> {
    let expr = expr.trim();

    // String concatenation
    if expr.contains('+') && (expr.contains('"') || expr.contains('\'')) {
        let parts: Vec<&str> = expr.split('+').collect();
        let mut result = String::new();
        for part in parts {
            let part = part.trim().trim_matches('"').trim_matches('\'');
            result.push_str(part);
        }
        return Ok(result);
    }

    // Simple numeric expression
    if let Ok(v) = eval_numeric(expr) {
        return Ok(format!("{:.4}", v).trim_end_matches('0').trim_end_matches('.').to_string());
    }

    Ok(expr.trim_matches('"').trim_matches('\'').to_string())
}

fn eval_numeric(expr: &str) -> Result<f64, ()> {
    let expr = expr.trim();
    if let Ok(n) = expr.parse::<f64>() { return Ok(n); }

    // Handle + - * / with operator precedence
    // Find last + or - (not inside parens)
    let mut depth = 0i32;
    let chars: Vec<char> = expr.chars().collect();

    for i in (0..chars.len()).rev() {
        match chars[i] {
            ')' => depth += 1,
            '(' => depth -= 1,
            '+' | '-' if depth == 0 && i > 0 => {
                let left = eval_numeric(&expr[..i])?;
                let right = eval_numeric(&expr[i+1..])?;
                return Ok(if chars[i] == '+' { left + right } else { left - right });
            }
            _ => {}
        }
    }

    for i in (0..chars.len()).rev() {
        match chars[i] {
            ')' => depth += 1,
            '(' => depth -= 1,
            '*' | '/' if depth == 0 => {
                let left = eval_numeric(&expr[..i])?;
                let right = eval_numeric(&expr[i+1..])?;
                return Ok(if chars[i] == '*' { left * right } else if right != 0.0 { left / right } else { f64::NAN });
            }
            _ => {}
        }
    }

    if expr.starts_with('(') && expr.ends_with(')') {
        return eval_numeric(&expr[1..expr.len()-1]);
    }

    Err(())
}

#[tauri::command]
pub async fn apply_formula(data: CsvData, expression: String) -> Result<FormulaResult, String> {
    let parts: Vec<&str> = expression.splitn(2, '=').collect();
    if parts.len() != 2 {
        return Ok(FormulaResult { success: false, new_column: String::new(), rows: None, error: Some("Invalid formula. Use: new_column = expression".to_string()) });
    }

    let new_column = parts[0].trim().to_string();
    let expr = parts[1].trim();

    let mut new_rows = Vec::new();
    for row in &data.rows {
        let mut new_row = row.clone();
        let result = evaluate_expr(expr, row, &data.headers).unwrap_or_default();
        new_row.insert(new_column.clone(), result);
        new_rows.push(new_row);
    }

    Ok(FormulaResult { success: true, new_column, rows: Some(new_rows), error: None })
}
