mod commands;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::parse::parse_csv_file,
            commands::parse::parse_csv_string,
            commands::stats::compute_column_stats,
            commands::stats::compute_all_stats,
            commands::profile::profile_csv,
            commands::anomaly::detect_anomalies,
            commands::fuzzy::find_fuzzy_duplicates,
            commands::pii::detect_pii,
            commands::pii::mask_pii,
            commands::formula::apply_formula,
            commands::export::export_csv,
            commands::export::export_json,
            commands::export::export_sql,
            commands::export::export_html,
            commands::export::export_markdown,
            commands::schema::generate_schema,
            commands::query::nl_query,
            commands::diff::diff_csvs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
