use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsvData {
    pub headers: Vec<String>,
    pub rows: Vec<HashMap<String, String>>,
    pub total_rows: usize,
    pub file_path: String,
    pub file_name: String,
    pub file_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnProfile {
    pub name: String,
    pub data_type: String,
    pub null_count: usize,
    pub null_percent: f64,
    pub unique_count: usize,
    pub unique_percent: f64,
    pub min: Option<String>,
    pub max: Option<String>,
    pub mean: Option<f64>,
    pub median: Option<f64>,
    pub std_dev: Option<f64>,
    pub top_values: Vec<TopValue>,
    pub sample_values: Vec<String>,
    pub has_anomaly: bool,
    pub has_pii: bool,
    pub pii_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopValue {
    pub value: String,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataProfile {
    pub columns: Vec<ColumnProfile>,
    pub total_rows: usize,
    pub total_columns: usize,
    pub total_nulls: usize,
    pub duplicate_rows: usize,
    pub health_score: u32,
    pub generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsResult {
    pub column: String,
    pub count: usize,
    pub sum: Option<f64>,
    pub mean: Option<f64>,
    pub median: Option<f64>,
    pub mode: Option<String>,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub std_dev: Option<f64>,
    pub variance: Option<f64>,
    pub range: Option<f64>,
    pub q1: Option<f64>,
    pub q3: Option<f64>,
    pub iqr: Option<f64>,
    pub skewness: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyResult {
    pub row_index: usize,
    pub column: String,
    pub value: String,
    pub score: f64,
    pub method: String,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FuzzyDuplicate {
    pub row1_index: usize,
    pub row2_index: usize,
    pub similarity: f64,
    pub matched_columns: Vec<String>,
    pub row1_data: HashMap<String, String>,
    pub row2_data: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PiiResult {
    pub row_index: usize,
    pub column: String,
    pub value: String,
    pub pii_type: String,
    pub masked: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaOutput {
    pub sql: String,
    pub json_schema: String,
    pub rust_struct: String,
    pub typescript: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffResult {
    pub added_rows: Vec<usize>,
    pub deleted_rows: Vec<usize>,
    pub modified_cells: Vec<ModifiedCell>,
    pub summary: DiffSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModifiedCell {
    pub row: usize,
    pub column: String,
    pub old_value: String,
    pub new_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffSummary {
    pub added: usize,
    pub deleted: usize,
    pub modified: usize,
}
