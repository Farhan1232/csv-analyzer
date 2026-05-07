import type {
  CsvData, ColumnProfile, DataProfile, DataType, PiiType,
  StatsResult, FilterRule, AnomalyResult, FuzzyDuplicate,
  PiiDetectionResult, SchemaOutput
} from "../types";

// ─── Type Detection ──────────────────────────────────────────────────────────

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE    = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const URL_RE      = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}/;
const IP_RE       = /^(\d{1,3}\.){3}\d{1,3}$/;
const CC_RE       = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})$/;
const SSN_RE      = /^\d{3}-\d{2}-\d{4}$/;
const DATE_RE     = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}(T\d{2}:\d{2})?/;
const BOOL_VALS   = new Set(["true","false","yes","no","1","0","t","f","y","n"]);

export function detectType(values: string[]): DataType {
  const nonEmpty = values.filter(v => v !== "" && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return "empty";

  const sample = nonEmpty.slice(0, 200);
  let intCount = 0, floatCount = 0, boolCount = 0, dateCount = 0,
      emailCount = 0, phoneCount = 0, urlCount = 0, ipCount = 0,
      ccCount = 0, ssnCount = 0;

  for (const v of sample) {
    const t = v.trim();
    if (!isNaN(Number(t)) && !t.includes(".")) intCount++;
    else if (!isNaN(parseFloat(t))) floatCount++;
    if (BOOL_VALS.has(t.toLowerCase())) boolCount++;
    if (DATE_RE.test(t)) dateCount++;
    if (EMAIL_RE.test(t)) emailCount++;
    if (PHONE_RE.test(t.replace(/\s/g, ""))) phoneCount++;
    if (URL_RE.test(t)) urlCount++;
    if (IP_RE.test(t)) ipCount++;
    if (CC_RE.test(t.replace(/[\s-]/g, ""))) ccCount++;
    if (SSN_RE.test(t)) ssnCount++;
  }

  const n = sample.length;
  const pct = (c: number) => c / n;

  if (pct(emailCount) > 0.8) return "email";
  if (pct(ccCount) > 0.8) return "credit_card";
  if (pct(ssnCount) > 0.8) return "ssn";
  if (pct(phoneCount) > 0.8) return "phone";
  if (pct(urlCount) > 0.8) return "url";
  if (pct(ipCount) > 0.8) return "ip_address";
  if (pct(dateCount) > 0.7) return sample.some(v => v.includes("T")) ? "datetime" : "date";
  if (pct(boolCount) > 0.9) return "boolean";
  if (pct(intCount) > 0.9) return "integer";
  if (pct(floatCount) > 0.7) return "float";
  return "text";
}

function detectPii(type: DataType): PiiType {
  const map: Partial<Record<DataType, PiiType>> = {
    email: "email", phone: "phone", credit_card: "credit_card",
    ssn: "ssn", ip_address: "ip_address",
  };
  return map[type] ?? "none";
}

// ─── Profiling ────────────────────────────────────────────────────────────────

export function profileData(data: CsvData): DataProfile {
  const { headers, rows } = data;
  const columns: ColumnProfile[] = headers.map(col => {
    const vals = rows.map(r => r[col] ?? "");
    const nonEmpty = vals.filter(v => v !== "");
    const nullCount = vals.length - nonEmpty.length;
    const unique = new Set(nonEmpty);
    const type = detectType(vals);
    const piiType = detectPii(type);

    const numVals = nonEmpty.map(Number).filter(n => !isNaN(n));
    const sorted = [...numVals].sort((a, b) => a - b);
    const mean = numVals.length ? numVals.reduce((a, b) => a + b, 0) / numVals.length : undefined;
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined;
    const stdDev = mean !== undefined && numVals.length > 1
      ? Math.sqrt(numVals.reduce((s, v) => s + (v - mean) ** 2, 0) / numVals.length)
      : undefined;

    const freq: Record<string, number> = {};
    for (const v of nonEmpty) freq[v] = (freq[v] || 0) + 1;
    const topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    const zscores = mean !== undefined && stdDev ? numVals.map(v => Math.abs((v - mean) / (stdDev || 1))) : [];
    const hasAnomaly = zscores.some(z => z > 3);

    return {
      name: col, dataType: type, nullCount,
      nullPercent: parseFloat(((nullCount / vals.length) * 100).toFixed(1)),
      uniqueCount: unique.size,
      uniquePercent: parseFloat(((unique.size / (nonEmpty.length || 1)) * 100).toFixed(1)),
      min: sorted.length ? String(sorted[0]) : undefined,
      max: sorted.length ? String(sorted[sorted.length - 1]) : undefined,
      mean: mean !== undefined ? parseFloat(mean.toFixed(4)) : undefined,
      median: median !== undefined ? parseFloat(median.toFixed(4)) : undefined,
      stdDev: stdDev !== undefined ? parseFloat(stdDev.toFixed(4)) : undefined,
      topValues, sampleValues: nonEmpty.slice(0, 3),
      hasAnomaly, hasPii: piiType !== "none", piiType: piiType !== "none" ? piiType : undefined,
    };
  });

  const seenRows = new Set<string>();
  let dupCount = 0;
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (seenRows.has(key)) dupCount++;
    else seenRows.add(key);
  }

  const totalNulls = columns.reduce((s, c) => s + c.nullCount, 0);
  const nullPenalty = (totalNulls / (rows.length * headers.length)) * 30;
  const dupPenalty = (dupCount / rows.length) * 20;
  const piiPenalty = columns.filter(c => c.hasPii).length * 2;
  const healthScore = Math.max(0, Math.round(100 - nullPenalty - dupPenalty - piiPenalty));

  return {
    columns, totalRows: rows.length, totalColumns: headers.length,
    totalNulls, duplicateRows: dupCount, healthScore,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export function computeStats(data: CsvData, column: string): StatsResult {
  const vals = data.rows.map(r => r[column]).filter(v => v !== "" && !isNaN(Number(v))).map(Number);
  if (vals.length === 0) return { column, count: 0 };

  vals.sort((a, b) => a - b);
  const n = vals.length;
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 === 0 ? (vals[n / 2 - 1] + vals[n / 2]) / 2 : vals[Math.floor(n / 2)];
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const q1 = vals[Math.floor(n * 0.25)];
  const q3 = vals[Math.floor(n * 0.75)];
  const skewness = stdDev > 0 ? (vals.reduce((s, v) => s + ((v - mean) / stdDev) ** 3, 0) / n) : 0;

  const freq: Record<number, number> = {};
  for (const v of vals) freq[v] = (freq[v] || 0) + 1;
  const mode = String(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);

  return {
    column, count: n, sum: parseFloat(sum.toFixed(4)), mean: parseFloat(mean.toFixed(4)),
    median: parseFloat(median.toFixed(4)), mode, min: vals[0], max: vals[n - 1],
    stdDev: parseFloat(stdDev.toFixed(4)), variance: parseFloat(variance.toFixed(4)),
    range: parseFloat((vals[n - 1] - vals[0]).toFixed(4)),
    q1: parseFloat(q1.toFixed(4)), q3: parseFloat(q3.toFixed(4)),
    iqr: parseFloat((q3 - q1).toFixed(4)), skewness: parseFloat(skewness.toFixed(4)),
  };
}

// ─── Filtering ────────────────────────────────────────────────────────────────

export function applyFilters(data: CsvData, rules: FilterRule[]): CsvData {
  if (!rules.length) return data;
  const filtered = data.rows.filter(row => {
    let result = true;
    for (let i = 0; i < rules.length; i++) {
      const { column, operator, value, logicalOp } = rules[i];
      const cell = (row[column] ?? "").toLowerCase();
      const val = value.toLowerCase();
      let match = false;
      switch (operator) {
        case "equals":       match = cell === val; break;
        case "not_equals":   match = cell !== val; break;
        case "contains":     match = cell.includes(val); break;
        case "not_contains": match = !cell.includes(val); break;
        case "starts_with":  match = cell.startsWith(val); break;
        case "ends_with":    match = cell.endsWith(val); break;
        case "greater_than": match = parseFloat(cell) > parseFloat(val); break;
        case "less_than":    match = parseFloat(cell) < parseFloat(val); break;
        case "greater_eq":   match = parseFloat(cell) >= parseFloat(val); break;
        case "less_eq":      match = parseFloat(cell) <= parseFloat(val); break;
        case "is_null":      match = cell === ""; break;
        case "is_not_null":  match = cell !== ""; break;
        case "regex":        try { match = new RegExp(value, "i").test(row[column] ?? ""); } catch { match = false; } break;
      }
      if (i === 0) result = match;
      else if (logicalOp === "OR") result = result || match;
      else result = result && match;
    }
    return result;
  });
  return { ...data, rows: filtered, totalRows: filtered.length };
}

// ─── Anomaly Detection ────────────────────────────────────────────────────────

export function detectAnomalies(data: CsvData, threshold = 3): AnomalyResult[] {
  const results: AnomalyResult[] = [];
  for (const col of data.headers) {
    const vals = data.rows.map((r, i) => ({ val: Number(r[col]), idx: i, raw: r[col] }))
      .filter(v => !isNaN(v.val) && v.raw !== "");
    if (vals.length < 5) continue;
    const nums = vals.map(v => v.val);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const std = Math.sqrt(nums.reduce((s, v) => s + (v - mean) ** 2, 0) / nums.length);
    const sorted = [...nums].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    for (const { val, idx, raw } of vals) {
      const z = std > 0 ? Math.abs((val - mean) / std) : 0;
      const isIqrOut = val < q1 - 1.5 * iqr || val > q3 + 1.5 * iqr;
      if (z > threshold || isIqrOut) {
        results.push({
          rowIndex: idx, column: col, value: raw, score: parseFloat(z.toFixed(2)),
          method: z > threshold ? "zscore" : "iqr",
          severity: z > 5 ? "high" : z > 4 ? "medium" : "low",
        });
      }
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

// ─── Fuzzy Duplicates ─────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

export function findFuzzyDuplicates(data: CsvData, threshold = 0.85): FuzzyDuplicate[] {
  const results: FuzzyDuplicate[] = [];
  const textCols = data.headers.filter(h => {
    const vals = data.rows.slice(0, 50).map(r => r[h] ?? "");
    const type = detectType(vals);
    return type === "text" || type === "email";
  });

  const limit = Math.min(data.rows.length, 500);
  for (let i = 0; i < limit; i++) {
    for (let j = i + 1; j < limit; j++) {
      const matched: string[] = [];
      let totalSim = 0;
      for (const col of textCols) {
        const sim = similarity(data.rows[i][col] ?? "", data.rows[j][col] ?? "");
        if (sim >= threshold) { matched.push(col); totalSim += sim; }
      }
      const avgSim = textCols.length > 0 ? totalSim / textCols.length : 0;
      if (matched.length >= Math.ceil(textCols.length * 0.6) && avgSim >= threshold) {
        results.push({
          row1Index: i, row2Index: j,
          similarity: parseFloat((avgSim * 100).toFixed(1)),
          matchedColumns: matched,
          row1Data: data.rows[i], row2Data: data.rows[j],
        });
      }
    }
  }
  return results.sort((a, b) => b.similarity - a.similarity);
}

// ─── PII Detection & Masking ─────────────────────────────────────────────────

function maskValue(value: string, piiType: PiiType): string {
  switch (piiType) {
    case "email": {
      const [local, domain] = value.split("@");
      return `${local[0]}***@${domain}`;
    }
    case "phone":       return value.replace(/\d(?=\d{4})/g, "*");
    case "credit_card": return `****-****-****-${value.replace(/\D/g, "").slice(-4)}`;
    case "ssn":         return `***-**-${value.split("-")[2] ?? "****"}`;
    case "ip_address":  return value.split(".").map((p, i) => i < 2 ? "***" : p).join(".");
    default:            return "***MASKED***";
  }
}

export function detectAndMaskPii(data: CsvData, maskData = false): { results: PiiDetectionResult[]; maskedData?: CsvData } {
  const results: PiiDetectionResult[] = [];
  const piiCols: Record<string, PiiType> = {};

  for (const col of data.headers) {
    const vals = data.rows.slice(0, 100).map(r => r[col] ?? "");
    const type = detectType(vals);
    const pii = detectPii(type);
    if (pii !== "none") piiCols[col] = pii;
  }

  for (let i = 0; i < data.rows.length; i++) {
    for (const [col, piiType] of Object.entries(piiCols)) {
      const value = data.rows[i][col] ?? "";
      if (value) {
        results.push({ rowIndex: i, column: col, value, piiType, masked: maskValue(value, piiType) });
      }
    }
  }

  if (!maskData) return { results };

  const maskedRows = data.rows.map(row => {
    const newRow = { ...row };
    for (const [col, piiType] of Object.entries(piiCols)) {
      if (newRow[col]) newRow[col] = maskValue(newRow[col], piiType);
    }
    return newRow;
  });

  return { results, maskedData: { ...data, rows: maskedRows } };
}

// ─── Formula Engine ───────────────────────────────────────────────────────────

export function applyFormula(data: CsvData, expression: string): { rows: Record<string, string>[]; newColumn: string } | { error: string } {
  const match = expression.match(/^(\w+)\s*=\s*(.+)$/);
  if (!match) return { error: "Invalid formula. Use: newColumn = expression" };

  const [, newColumn, expr] = match;

  try {
    const rows = data.rows.map(row => {
      const scope: Record<string, number | string> = {};
      for (const h of data.headers) {
        const v = row[h] ?? "";
        scope[h] = isNaN(Number(v)) || v === "" ? v : Number(v);
      }
      let evaled: string;
      try {
        const fn = new Function(...Object.keys(scope), `return (${expr})`);
        evaled = String(fn(...Object.values(scope)));
      } catch {
        evaled = "";
      }
      return { ...row, [newColumn]: evaled };
    });
    return { rows, newColumn };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── Natural Language Query ───────────────────────────────────────────────────

export function nlQuery(data: CsvData, query: string): CsvData | { error: string } {
  const q = query.toLowerCase().trim();
  let result = { ...data };

  const topMatch = q.match(/top\s+(\d+)\s+by\s+(\w+)/);
  if (topMatch) {
    const n = parseInt(topMatch[1]);
    const col = data.headers.find(h => h.toLowerCase() === topMatch[2]);
    if (!col) return { error: `Column "${topMatch[2]}" not found` };
    const sorted = [...data.rows].sort((a, b) => Number(b[col]) - Number(a[col])).slice(0, n);
    return { ...data, rows: sorted, totalRows: sorted.length };
  }

  const whereMatch = q.match(/where\s+(.+)/);
  if (whereMatch) {
    const conditions = whereMatch[1];
    const gtMatch = conditions.match(/(\w+)\s*>\s*(\d+)/g);
    const ltMatch = conditions.match(/(\w+)\s*<\s*(\d+)/g);
    const eqMatch = conditions.match(/(\w+)\s+is\s+(.+)/);

    let rows = data.rows;
    if (gtMatch) {
      for (const m of gtMatch) {
        const [col, val] = m.split(/>/).map(s => s.trim());
        const h = data.headers.find(h => h.toLowerCase() === col.toLowerCase());
        if (h) rows = rows.filter(r => Number(r[h]) > Number(val));
      }
    }
    if (ltMatch) {
      for (const m of ltMatch) {
        const [col, val] = m.split(/</).map(s => s.trim());
        const h = data.headers.find(h => h.toLowerCase() === col.toLowerCase());
        if (h) rows = rows.filter(r => Number(r[h]) < Number(val));
      }
    }
    if (eqMatch) {
      const col = data.headers.find(h => h.toLowerCase() === eqMatch[1].toLowerCase());
      if (col) rows = rows.filter(r => r[col].toLowerCase() === eqMatch[2].toLowerCase().trim());
    }
    result = { ...data, rows, totalRows: rows.length };
  }

  const countMatch = q.match(/count.*group(?:ed)?\s+by\s+(\w+)/);
  if (countMatch) {
    const col = data.headers.find(h => h.toLowerCase() === countMatch[1].toLowerCase());
    if (!col) return { error: `Column "${countMatch[1]}" not found` };
    const freq: Record<string, number> = {};
    for (const row of data.rows) freq[row[col]] = (freq[row[col]] || 0) + 1;
    const rows = Object.entries(freq).map(([val, count]) => ({ [col]: val, count: String(count) }));
    return { ...data, headers: [col, "count"], rows, totalRows: rows.length };
  }

  return result;
}

// ─── Schema Generator ─────────────────────────────────────────────────────────

export function generateSchema(_data: CsvData, profile: DataProfile, tableName = "my_table"): SchemaOutput {
  const typeMapSql: Record<DataType, string> = {
    integer: "INTEGER", float: "DECIMAL(18,4)", boolean: "BOOLEAN",
    date: "DATE", datetime: "TIMESTAMP", email: "VARCHAR(255)",
    phone: "VARCHAR(20)", url: "TEXT", ip_address: "VARCHAR(45)",
    credit_card: "VARCHAR(20)", ssn: "VARCHAR(11)", text: "TEXT", empty: "TEXT",
  };

  const sqlCols = profile.columns.map(c =>
    `  ${c.name} ${typeMapSql[c.dataType]}${c.nullCount === 0 ? " NOT NULL" : ""}`
  ).join(",\n");
  const sql = `CREATE TABLE ${tableName} (\n  id SERIAL PRIMARY KEY,\n${sqlCols}\n);`;

  const jsonProps = Object.fromEntries(profile.columns.map(c => [
    c.name,
    { type: c.dataType === "integer" ? "integer" : c.dataType === "float" ? "number" : "string", description: `${c.dataType} field` },
  ]));
  const jsonSchema = JSON.stringify({
    $schema: "http://json-schema.org/draft-07/schema#",
    title: tableName, type: "object",
    properties: jsonProps,
    required: profile.columns.filter(c => c.nullCount === 0).map(c => c.name),
  }, null, 2);

  const typeMapRust: Record<DataType, string> = {
    integer: "i64", float: "f64", boolean: "bool",
    date: "String", datetime: "String", email: "String",
    phone: "String", url: "String", ip_address: "String",
    credit_card: "String", ssn: "String", text: "String", empty: "Option<String>",
  };
  const rustFields = profile.columns.map(c =>
    `    pub ${c.name.replace(/[^a-z0-9_]/gi, "_").toLowerCase()}: ${c.nullPercent > 0 ? `Option<${typeMapRust[c.dataType]}>` : typeMapRust[c.dataType]},`
  ).join("\n");
  const rustStruct = `use serde::{Deserialize, Serialize};\n\n#[derive(Debug, Serialize, Deserialize)]\npub struct ${tableName.replace(/^\w/, c => c.toUpperCase())} {\n${rustFields}\n}`;

  const tsFields = profile.columns.map(c => {
    const tsType = ["integer","float"].includes(c.dataType) ? "number" : c.dataType === "boolean" ? "boolean" : "string";
    return `  ${c.name}${c.nullPercent > 0 ? "?" : ""}: ${tsType};`;
  }).join("\n");
  const typescript = `export interface ${tableName.replace(/^\w/, c => c.toUpperCase())} {\n${tsFields}\n}`;

  return { sql, jsonSchema, rustStruct, typescript };
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportToCsv(data: CsvData): string {
  const header = data.headers.join(",");
  const rows = data.rows.map(r => data.headers.map(h => {
    const v = r[h] ?? "";
    return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(","));
  return [header, ...rows].join("\n");
}

export function exportToJson(data: CsvData): string {
  return JSON.stringify(data.rows, null, 2);
}

export function exportToMarkdown(data: CsvData): string {
  const header = `| ${data.headers.join(" | ")} |`;
  const separator = `| ${data.headers.map(() => "---").join(" | ")} |`;
  const rows = data.rows.map(r => `| ${data.headers.map(h => r[h] ?? "").join(" | ")} |`);
  return [header, separator, ...rows].join("\n");
}

export function exportToSql(data: CsvData, tableName = "my_table"): string {
  const lines = data.rows.map(row => {
    const vals = data.headers.map(h => {
      const v = row[h] ?? "";
      return `'${v.replace(/'/g, "''")}'`;
    });
    return `INSERT INTO ${tableName} (${data.headers.join(", ")}) VALUES (${vals.join(", ")});`;
  });
  return lines.join("\n");
}

export function exportToHtml(csvData: CsvData): string {
  const data = csvData;
  const headers = data.headers.map(h => `<th>${h}</th>`).join("");
  const rows = data.rows.map(r =>
    `<tr>${data.headers.map(h => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`
  ).join("\n");
  return `<!DOCTYPE html><html><head><style>
    body{font-family:sans-serif;padding:20px}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#0ea5e9;color:white}
    tr:nth-child(even){background:#f2f2f2}
  </style></head><body>
    <h2>CSV Export</h2>
    <table><thead><tr>${headers}</tr></thead><tbody>\n${rows}\n</tbody></table>
  </body></html>`;
}
