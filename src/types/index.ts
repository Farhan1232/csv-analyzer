export interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  filePath: string;
  fileName: string;
  fileSize: number;
}

export interface ColumnProfile {
  name: string;
  dataType: DataType;
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  min?: string;
  max?: string;
  mean?: number;
  median?: number;
  stdDev?: number;
  topValues: { value: string; count: number }[];
  sampleValues: string[];
  hasAnomaly: boolean;
  hasPii: boolean;
  piiType?: PiiType;
}

export type DataType =
  | "integer"
  | "float"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "url"
  | "ip_address"
  | "credit_card"
  | "ssn"
  | "text"
  | "empty";

export type PiiType =
  | "email"
  | "phone"
  | "credit_card"
  | "ssn"
  | "ip_address"
  | "name"
  | "none";

export interface DataProfile {
  columns: ColumnProfile[];
  totalRows: number;
  totalColumns: number;
  totalNulls: number;
  duplicateRows: number;
  healthScore: number;
  generatedAt: string;
}

export interface StatsResult {
  column: string;
  count: number;
  sum?: number;
  mean?: number;
  median?: number;
  mode?: string;
  min?: number;
  max?: number;
  stdDev?: number;
  variance?: number;
  range?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  skewness?: number;
}

export interface FilterRule {
  column: string;
  operator: FilterOperator;
  value: string;
  logicalOp?: "AND" | "OR";
}

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_eq"
  | "less_eq"
  | "is_null"
  | "is_not_null"
  | "regex";

export interface SortRule {
  column: string;
  direction: "asc" | "desc";
}

export interface AnomalyResult {
  rowIndex: number;
  column: string;
  value: string;
  score: number;
  method: "zscore" | "iqr";
  severity: "low" | "medium" | "high";
}

export interface FuzzyDuplicate {
  row1Index: number;
  row2Index: number;
  similarity: number;
  matchedColumns: string[];
  row1Data: Record<string, string>;
  row2Data: Record<string, string>;
}

export interface PiiDetectionResult {
  rowIndex: number;
  column: string;
  value: string;
  piiType: PiiType;
  masked: string;
}

export interface FormulaResult {
  success: boolean;
  newColumn: string;
  rows?: Record<string, string>[];
  error?: string;
}

export interface JoinConfig {
  file1: string;
  file2: string;
  joinType: "inner" | "left" | "right" | "outer";
  on: string[];
}

export interface DiffResult {
  addedRows: number[];
  deletedRows: number[];
  modifiedCells: { row: number; column: string; oldValue: string; newValue: string }[];
  summary: { added: number; deleted: number; modified: number };
}

export interface ExportConfig {
  format: "csv" | "json" | "sql" | "html" | "markdown" | "xlsx";
  tableName?: string;
  includeHeaders?: boolean;
  selectedColumns?: string[];
}

export interface SchemaOutput {
  sql?: string;
  jsonSchema?: string;
  rustStruct?: string;
  typescript?: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export type ActiveTab =
  | "home"
  | "data"
  | "profile"
  | "stats"
  | "filter"
  | "anomaly"
  | "duplicates"
  | "pii"
  | "formula"
  | "join"
  | "diff"
  | "charts"
  | "export"
  | "schema"
  | "query";

export interface AppState {
  csvData: CsvData | null;
  activeTab: ActiveTab;
  isLoading: boolean;
  loadingMessage: string;
  darkMode: boolean;
}
