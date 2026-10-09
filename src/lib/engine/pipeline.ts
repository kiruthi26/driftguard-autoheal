import { cloneDataset, type Cell, type Dataset } from "./data";
import {
  countDuplicates, detectAnomalies, inferType, isMissing, ksTest, numericValues, profileDataset,
  psiCategorical, psiNumeric, quantile, toNum, type AnomalyRecord, type ColType, type KsResult, type Profile, type PsiResult,
} from "./stats";

export interface Settings {
  autoRemediation: boolean;
  psiThreshold: number;
  ksAlpha: number;
  ifThreshold: number;
  missingTolerance: number; // absolute ratio increase allowed
  speed: number; // 0.5 = fast, 2 = slow
}
export const DEFAULT_SETTINGS: Settings = { autoRemediation: true, psiThreshold: 0.25, ksAlpha: 0.05, ifThreshold: 0.75, missingTolerance: 0.02, speed: 1 };

export const VALID_RANGES: Record<string, [number, number]> = { Age: [18, 75], Salary: [0, 5_000_000] };

export interface SchemaChange { column: string; change: "NEW" | "REMOVED" | "TYPE" | "NULLABILITY"; before: string; after: string; severity: Severity }
export type Severity = "HIGH" | "MEDIUM" | "LOW";

export interface Analysis {
  profile: Profile;
  schema: SchemaChange[];
  psi: PsiResult[];
  ks: KsResult[];
  anomalies: AnomalyRecord[];
  anomalyCount: number;
  invalid: { index: number; column: string; value: Cell }[];
  quality: QualityBreakdown;
}

export interface QualityBreakdown { score: number; parts: { label: string; penalty: number }[] }

const typeLabel = (t: ColType) => ({ integer: "Integer", float: "Float", string: "String", empty: "Empty" })[t];

export function schemaDiff(base: Dataset, cur: Dataset, bp: Profile, cp: Profile): SchemaChange[] {
  const out: SchemaChange[] = [];
  for (const c of cur.columns) if (!base.columns.includes(c)) out.push({ column: c, change: "NEW", before: "—", after: typeLabel(cp.cols[c].type), severity: "LOW" });
  for (const c of base.columns) if (!cur.columns.includes(c)) out.push({ column: c, change: "REMOVED", before: typeLabel(bp.cols[c].type), after: "—", severity: "HIGH" });
  for (const c of base.columns) {
    if (!cur.columns.includes(c)) continue;
    const a = bp.cols[c].type, b = cp.cols[c].type;
    if (a !== b && b !== "empty" && !(a === "integer" && b === "float")) out.push({ column: c, change: "TYPE", before: typeLabel(a), after: typeLabel(b), severity: "HIGH" });
    else if (bp.cols[c].missing === 0 && cp.cols[c].missing > 0) out.push({ column: c, change: "NULLABILITY", before: "Non-null", after: "Nullable", severity: "LOW" });
  }
  return out;
}

export function findInvalid(ds: Dataset) {
  const out: { index: number; column: string; value: Cell }[] = [];
  ds.rows.forEach((r, index) => {
    for (const [col, [lo, hi]] of Object.entries(VALID_RANGES)) {
      if (!ds.columns.includes(col)) continue;
      const v = r[col];
      if (isMissing(v)) continue;
      const n = toNum(v);
      if (n === null || n < lo || n > hi) out.push({ index, column: col, value: v });
    }
  });
  return out;
}

export function driftTests(base: Dataset, cur: Dataset, s: Settings) {
  const psi: PsiResult[] = [];
  const ks: KsResult[] = [];
  for (const c of ["Age", "Salary"]) {
    if (!base.columns.includes(c) || !cur.columns.includes(c)) continue;
    const [lo, hi] = VALID_RANGES[c];
    const b = numericValues(base, c).filter((x) => x >= lo && x <= hi);
    const k = numericValues(cur, c).filter((x) => x >= lo && x <= hi);
    if (b.length < 10 || k.length < 10) continue;
    psi.push(psiNumeric(c, b, k));
    ks.push(ksTest(c, b, k, s.ksAlpha));
  }
  for (const c of ["Department", "Location"]) {
    if (!base.columns.includes(c) || !cur.columns.includes(c)) continue;
    const b = base.rows.map((r) => r[c]).filter((v) => !isMissing(v)).map(String);
    const k = cur.rows.map((r) => r[c]).filter((v) => !isMissing(v)).map(String);
    psi.push(psiCategorical(c, b, k));
  }
  return { psi, ks };
}

export function analyze(ds: Dataset, base: Dataset, s: Settings): Analysis {
  const profile = profileDataset(ds);
  const bp = ds === base ? profile : profileDataset(base);
  const schema = schemaDiff(base, ds, bp, profile);
  const { psi, ks } = driftTests(base, ds, s);
  const anomalies = detectAnomalies(ds, s.ifThreshold);
  const anomalyCount = anomalies.filter((a) => a.anomaly).length;
  const invalid = findInvalid(ds);
  const quality = qualityScore(profile, schema, psi, s, anomalyCount, invalid.length);
  return { profile, schema, psi, ks, anomalies, anomalyCount, invalid, quality };
}

export function qualityScore(p: Profile, schema: SchemaChange[], psi: PsiResult[], s: Settings, anomalies: number, invalid: number): QualityBreakdown {
  const n = Math.max(1, p.rows);
  const parts = [
    { label: "Missing values", penalty: Math.min(20, p.missingRatio * 100 * 2.2) },
    { label: "Duplicates", penalty: Math.min(15, (p.duplicates / n) * 100 * 2) },
    { label: "Schema consistency", penalty: Math.min(20, schema.filter((c) => c.change !== "NULLABILITY").length * 7) },
    { label: "Invalid records", penalty: Math.min(15, invalid > 0 ? 3 + (invalid / n) * 300 : 0) },
    { label: "Distribution drift", penalty: Math.min(15, psi.filter((x) => x.psi > s.psiThreshold).length * 8 + psi.filter((x) => x.psi > 0.1 && x.psi <= s.psiThreshold).length * 3) },
    { label: "Anomalies", penalty: Math.min(15, (anomalies / n) * 100 * 3) },
  ].map((x) => ({ ...x, penalty: +x.penalty.toFixed(1) }));
  const score = Math.max(0, Math.round(100 - parts.reduce((a, b) => a + b.penalty, 0)));
  return { score, parts };
}

/* ---------------- Issues ---------------- */
export type IssueKind = "schema_type" | "schema_new" | "schema_removed" | "duplicate" | "invalid" | "anomaly" | "missing" | "drift";
export type IssueStatus = "DETECTED" | "PENDING" | "PROCESSING" | "VALIDATING" | "RESOLVED" | "FAILED" | "REQUIRES_REVIEW" | "QUARANTINED";

export interface Issue {
  id: string;
  kind: IssueKind;
  title: string;
  column?: string;
  detectedBy: string;
  severity: Severity;
  status: IssueStatus;
  before: string;
  after: string;
  metric: string;
  affected: number;
  cause: string;
  action: string;
  rule: string;
  progress: number;
  detectedAt: number;
  startedAt?: number;
  resolvedAt?: number;
  validation?: string;
  example?: { field: string; before: string; after?: string };
}

const ORDER: IssueKind[] = ["schema_type", "schema_removed", "duplicate", "invalid", "anomaly", "missing", "drift", "schema_new"];

export function detectIssues(ds: Dataset, base: Dataset, a: Analysis, baseA: Analysis, s: Settings): Omit<Issue, "detectedAt">[] {
  const out: Omit<Issue, "detectedAt">[] = [];
  const mk = (i: Omit<Issue, "status" | "progress" | "id" | "detectedAt">) => out.push({ ...i, id: `${i.kind}-${i.column ?? "all"}`, status: "DETECTED", progress: 0 });

  for (const c of a.schema) {
    if (c.change === "TYPE") {
      const vals = ds.rows.map((r) => r[c.column]).filter((v) => !isMissing(v));
      const sample = vals.find((v) => typeof v === "string") ?? vals[0];
      mk({ kind: "schema_type", column: c.column, title: `Schema Mismatch — ${c.column}`, detectedBy: "Schema Comparison", severity: "HIGH", before: c.before, after: c.after, metric: `${c.before} → ${c.after}`, affected: vals.length, cause: `Upstream source now emits ${c.column} as ${c.after.toLowerCase()}`, action: "Safe Auto-Casting", rule: "Schema / type mismatch → Safe Auto-Casting", example: { field: c.column, before: JSON.stringify(sample) } });
    }
    if (c.change === "REMOVED") mk({ kind: "schema_removed", column: c.column, title: `Removed Column — ${c.column}`, detectedBy: "Schema Comparison", severity: "HIGH", before: c.before, after: "Missing", metric: "Column dropped", affected: ds.rows.length, cause: "Column no longer emitted by source", action: "Requires Review / Quarantine", rule: "Unsafe / uncertain → Requires Review" });
    if (c.change === "NEW") mk({ kind: "schema_new", column: c.column, title: `New Column — ${c.column}`, detectedBy: "Schema Comparison", severity: "LOW", before: "Not in contract", after: c.after, metric: "Unknown column", affected: ds.rows.length, cause: "Column not part of the downstream data contract", action: "Requires Review / Quarantine", rule: "Unsafe / uncertain → Requires Review / Quarantine" });
  }

  const dup = a.profile.duplicates;
  if (dup > baseA.profile.duplicates) mk({ kind: "duplicate", title: "Duplicate Records", detectedBy: "Duplicate Detection (row hash)", severity: "MEDIUM", before: String(baseA.profile.duplicates), after: String(dup), metric: `${dup} duplicate rows`, affected: dup, cause: "Source re-sent previously delivered records", action: "Duplicate Resolution (keep first)", rule: "Duplicate records → Duplicate Resolution" });

  if (a.invalid.length) {
    const ex = a.invalid[0];
    mk({ kind: "invalid", column: [...new Set(a.invalid.map((x) => x.column))].join(", "), title: "Invalid Records", detectedBy: "Domain Rule Check", severity: "MEDIUM", before: String(baseA.invalid.length), after: String(a.invalid.length), metric: `${a.invalid.length} out-of-domain values`, affected: a.invalid.length, cause: "Values outside valid domain (e.g. Age 18–75) or not castable", action: "Correct (null → median) if safe", rule: "Invalid records → Correct if safely possible", example: { field: ex.column, before: JSON.stringify(ex.value) } });
  }

  const baseRate = baseA.anomalyCount / Math.max(1, baseA.profile.rows);
  const allowed = Math.max(3, Math.ceil(baseRate * a.profile.rows * 1.5));
  if (a.anomalyCount > allowed) {
    const top = [...a.anomalies].sort((x, y) => y.score - x.score)[0];
    mk({ kind: "anomaly", column: "Age, Salary", title: "Anomalies / Outliers", detectedBy: "Isolation Forest", severity: a.anomalyCount > 20 ? "HIGH" : "MEDIUM", before: String(baseA.anomalyCount), after: String(a.anomalyCount), metric: `${a.anomalyCount} records (score ≥ ${s.ifThreshold})`, affected: a.anomalyCount, cause: "Extreme values isolated far from the data mass", action: "Outlier Handling (IQR fence capping)", rule: "Outliers → Configured Outlier Handling", example: top ? { field: "Salary", before: String(top.salary) } : undefined });
  }

  for (const c of base.columns) {
    if (!ds.columns.includes(c)) continue;
    const bm = baseA.profile.cols[c]?.missingRatio ?? 0;
    const cm = a.profile.cols[c]?.missingRatio ?? 0;
    if (cm - bm > s.missingTolerance) {
      const numeric = baseA.profile.cols[c]?.numeric;
      mk({ kind: "missing", column: c, title: `Missing Values — ${c}`, detectedBy: "Data Quality Check", severity: cm > 0.05 ? "HIGH" : "MEDIUM", before: pct(bm), after: pct(cm), metric: `${pct(cm)} missing`, affected: a.profile.cols[c].missing, cause: "Null / missing data increase after update", action: numeric ? "Median Imputation" : "Mode Imputation", rule: numeric ? "Missing numerical values → Median Imputation" : "Missing categorical values → Mode Imputation", example: { field: c, before: "null" } });
    }
  }

  for (const p of a.psi) {
    const k = a.ks.find((x) => x.column === p.column);
    if (p.psi > s.psiThreshold || (k?.drift && p.psi > 0.1)) {
      const numeric = !!k;
      mk({ kind: "drift", column: p.column, title: `Distribution Drift — ${p.column}`, detectedBy: numeric ? "PSI + KS Test" : "PSI", severity: p.psi > s.psiThreshold ? "HIGH" : "MEDIUM", before: "Stable", after: `PSI ${p.psi.toFixed(2)}`, metric: `PSI ${p.psi.toFixed(3)}${k ? ` · KS ${k.statistic.toFixed(3)} (p=${k.pValue.toExponential(1)})` : ""}`, affected: a.profile.rows, cause: "Population shifted relative to baseline", action: numeric ? "Distribution Alignment (median rescale)" : "Requires Review", rule: numeric ? "Numeric drift → Distribution Alignment / Review" : "Unsafe / uncertain → Requires Review" });
    }
  }
  return out.sort((x, y) => ORDER.indexOf(x.kind) - ORDER.indexOf(y.kind));
}

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

/* ---------------- Remediation ---------------- */
export interface RemediationResult { ds: Dataset; changed: number; exampleAfter?: string; quarantined?: boolean; quarantineCol?: string }

function median(xs: number[]) { const s = [...xs].sort((a, b) => a - b); return quantile(s, 0.5); }
function mode(vals: Cell[]) {
  const m = new Map<string, number>();
  vals.filter((v) => !isMissing(v)).forEach((v) => m.set(String(v), (m.get(String(v)) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
const validNums = (ds: Dataset, c: string) => {
  const r = VALID_RANGES[c];
  return numericValues(ds, c).filter((x) => !r || (x >= r[0] && x <= r[1]));
};

export function remediate(issue: Issue, input: Dataset, base: Dataset, s: Settings): RemediationResult {
  const ds = cloneDataset(input);
  let changed = 0;
  let exampleAfter: string | undefined;
  const col = issue.column ?? "";
  switch (issue.kind) {
    case "schema_type": {
      const med = Math.round(median(validNums(ds, col)));
      for (const r of ds.rows) {
        const v = r[col];
        if (isMissing(v) || typeof v === "number") continue;
        const n = toNum(v);
        r[col] = n === null ? med : Math.round(n);
        changed++;
      }
      exampleAfter = issue.example ? String(toNum(JSON.parse(issue.example.before)) ?? med) : undefined;
      break;
    }
    case "duplicate": {
      const seen = new Set<string>();
      ds.rows = ds.rows.filter((r) => {
        const k = JSON.stringify(ds.columns.map((c) => r[c] ?? null));
        if (seen.has(k)) { changed++; return false; }
        seen.add(k); return true;
      });
      exampleAfter = `${ds.rows.length} unique rows`;
      break;
    }
    case "invalid": {
      for (const c of Object.keys(VALID_RANGES)) {
        if (!ds.columns.includes(c)) continue;
        const [lo, hi] = VALID_RANGES[c];
        const med = Math.round(median(validNums(ds, c)));
        for (const r of ds.rows) {
          if (isMissing(r[c])) continue;
          const n = toNum(r[c]);
          if (n === null || n < lo || n > hi) { r[c] = typeof base.rows[0]?.[c] === "number" || typeof r[c] === "number" ? med : String(med); changed++; }
        }
        if (issue.example?.field === c) exampleAfter = String(med);
      }
      break;
    }
    case "anomaly": {
      const flagged = detectAnomalies(ds, s.ifThreshold).filter((a) => a.anomaly);
      const fence = (c: string) => {
        const xs = validNums(ds, c).sort((a, b) => a - b);
        const q1 = quantile(xs, 0.25), q3 = quantile(xs, 0.75), iqr = q3 - q1;
        return [q1 - 1.5 * iqr, q3 + 1.5 * iqr] as const;
      };
      const [slo, shi] = fence("Salary");
      const [alo, ahi] = fence("Age");
      for (const f of flagged) {
        const r = ds.rows[f.index];
        const sv = toNum(r.Salary), av = toNum(r.Age);
        let touched = false;
        if (sv !== null && (sv > shi || sv < slo)) { r.Salary = Math.round(Math.min(shi, Math.max(slo, sv)) / 100) * 100; touched = true; }
        if (av !== null && (av > ahi || av < alo)) { r.Age = Math.round(Math.min(ahi, Math.max(alo, av))); touched = true; }
        if (touched) changed++;
      }
      exampleAfter = issue.example ? String(Math.round(Math.min(shi, Number(issue.example.before)) / 100) * 100) : undefined;
      break;
    }
    case "missing": {
      const numeric = base.rows.some((r) => typeof r[col] === "number");
      const fill = numeric ? Math.round(median(validNums(ds, col)) / 100) * 100 : mode(ds.rows.map((r) => r[col]));
      for (const r of ds.rows) if (isMissing(r[col])) { r[col] = fill; changed++; }
      exampleAfter = String(fill);
      break;
    }
    case "drift": {
      if (issue.action.startsWith("Requires")) return { ds, changed: 0, quarantined: true };
      const ratio = median(validNums(base, col)) / median(validNums(ds, col));
      for (const r of ds.rows) {
        const n = toNum(r[col]);
        if (n === null) continue;
        r[col] = col === "Salary" ? Math.round((n * ratio) / 100) * 100 : Math.round(n * ratio);
        changed++;
      }
      issue.example = { field: col, before: `median ${Math.round(median(validNums(input, col)))}` };
      exampleAfter = `median ${Math.round(median(validNums(ds, col)))} (×${ratio.toFixed(3)})`;
      break;
    }
    case "schema_new": {
      ds.columns = ds.columns.filter((c) => c !== col);
      for (const r of ds.rows) delete r[col];
      return { ds, changed: ds.rows.length, quarantined: true, quarantineCol: col };
    }
    case "schema_removed":
      return { ds, changed: 0, quarantined: true };
  }
  return { ds, changed, exampleAfter };
}

export function validateIssue(issue: Issue, ds: Dataset, base: Dataset, baseA: Analysis, s: Settings): { passed: boolean; msg: string } {
  const col = issue.column ?? "";
  switch (issue.kind) {
    case "schema_type": {
      const t = inferType(ds.rows.map((r) => r[col]));
      return { passed: t === "integer" || t === "float", msg: `${col} type is now ${t}` };
    }
    case "duplicate": { const d = countDuplicates(ds); return { passed: d === 0, msg: `${d} duplicates remain` }; }
    case "invalid": { const n = findInvalid(ds).length; return { passed: n === 0, msg: `${n} invalid values remain` }; }
    case "anomaly": {
      const n = detectAnomalies(ds, s.ifThreshold).filter((a) => a.anomaly).length;
      const allowed = Math.max(3, Math.ceil((baseA.anomalyCount / baseA.profile.rows) * ds.rows.length * 1.5));
      return { passed: n <= allowed, msg: `${n} anomalies remain (limit ${allowed})` };
    }
    case "missing": {
      const m = ds.rows.filter((r) => isMissing(r[col])).length / Math.max(1, ds.rows.length);
      const bm = baseA.profile.cols[col]?.missingRatio ?? 0;
      return { passed: m - bm <= s.missingTolerance, msg: `${col} missing ${pct(m)}` };
    }
    case "drift": {
      const { psi } = driftTests(base, ds, s);
      const p = psi.find((x) => x.column === col);
      return { passed: !!p && p.psi <= s.psiThreshold, msg: `PSI now ${p?.psi.toFixed(3)}` };
    }
    default:
      return { passed: false, msg: "Requires human review" };
  }
}

export interface ValidationCheck { name: string; before: string; after: string; passed: boolean; beforePassed: boolean; required: boolean }

export function validationChecks(before: Analysis, after: Analysis, baseA: Analysis, s: Settings): ValidationCheck[] {
  const schemaBad = (a: Analysis) => a.schema.filter((c) => c.change === "TYPE" || c.change === "REMOVED" || c.change === "NEW").length;
  const maxMissing = (a: Analysis) => Math.max(0, ...Object.values(a.profile.cols).map((c) => c.missingRatio - (baseA.profile.cols[c.name]?.missingRatio ?? 0)));
  const driftCols = (a: Analysis) => a.psi.filter((p) => p.psi > s.psiThreshold).length;
  const allowed = (a: Analysis) => Math.max(3, Math.ceil((baseA.anomalyCount / baseA.profile.rows) * a.profile.rows * 1.5));
  const mk = (name: string, f: (a: Analysis) => [string, boolean], required = true): ValidationCheck => {
    const [b, bp] = f(before);
    const [aa, ap] = f(after);
    return { name, before: b, after: aa, passed: ap, beforePassed: bp, required };
  };
  return [
    mk("Schema consistency", (a) => [`${schemaBad(a)} mismatches`, schemaBad(a) === 0]),
    mk("Missing values", (a) => [`+${pct(maxMissing(a))} max increase`, maxMissing(a) <= s.missingTolerance]),
    mk("Duplicate records", (a) => [`${a.profile.duplicates}`, a.profile.duplicates === 0]),
    mk("Invalid records", (a) => [`${a.invalid.length}`, a.invalid.length === 0]),
    mk("Distribution drift", (a) => [`${driftCols(a)} drifted columns`, driftCols(a) === 0]),
    mk("Anomalies", (a) => [`${a.anomalyCount}`, a.anomalyCount <= allowed(a)]),
    mk("Data quality ≥ 85", (a) => [`${a.quality.score}%`, a.quality.score >= 85]),
  ];
}
