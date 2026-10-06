import { rng, type Cell, type Dataset } from "./data";

export type ColType = "integer" | "float" | "string" | "empty";

export const isMissing = (v: Cell | undefined) => v === null || v === undefined || v === "";
export function toNum(v: Cell | undefined): number | null {
  if (isMissing(v)) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function inferType(values: (Cell | undefined)[]): ColType {
  const nn = values.filter((v) => !isMissing(v));
  if (!nn.length) return "empty";
  if (nn.every((v) => typeof v === "number")) return nn.every((v) => Number.isInteger(v)) ? "integer" : "float";
  return "string";
}

export function quantile(sorted: number[], q: number) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export interface ColumnProfile {
  name: string;
  type: ColType;
  missing: number;
  missingRatio: number;
  unique: number;
  numeric: boolean;
  mean?: number;
  median?: number;
  variance?: number;
  std?: number;
  min?: number;
  max?: number;
  p25?: number;
  p75?: number;
  top?: { value: string; count: number }[];
}

export interface Profile {
  rows: number;
  columns: number;
  columnNames: string[];
  cols: Record<string, ColumnProfile>;
  duplicates: number;
  missingCells: number;
  missingRatio: number;
}

export function numericValues(ds: Dataset, col: string) {
  const out: number[] = [];
  for (const r of ds.rows) {
    const n = toNum(r[col]);
    if (n !== null) out.push(n);
  }
  return out;
}

export function countDuplicates(ds: Dataset) {
  const seen = new Set<string>();
  let d = 0;
  for (const r of ds.rows) {
    const k = JSON.stringify(ds.columns.map((c) => r[c] ?? null));
    if (seen.has(k)) d++;
    else seen.add(k);
  }
  return d;
}

export function profileDataset(ds: Dataset): Profile {
  const cols: Record<string, ColumnProfile> = {};
  let missingCells = 0;
  for (const c of ds.columns) {
    const vals = ds.rows.map((r) => r[c]);
    const missing = vals.filter(isMissing).length;
    missingCells += missing;
    const nn = vals.filter((v) => !isMissing(v));
    const nums = nn.map(toNum).filter((x): x is number => x !== null);
    const numeric = nn.length > 0 && nums.length / nn.length > 0.9 && c !== "ID";
    const p: ColumnProfile = {
      name: c,
      type: inferType(vals),
      missing,
      missingRatio: ds.rows.length ? missing / ds.rows.length : 0,
      unique: new Set(nn.map(String)).size,
      numeric,
    };
    if (numeric) {
      const s = [...nums].sort((a, b) => a - b);
      const mean = s.reduce((a, b) => a + b, 0) / s.length;
      const variance = s.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, s.length - 1);
      Object.assign(p, { mean, median: quantile(s, 0.5), variance, std: Math.sqrt(variance), min: s[0], max: s[s.length - 1], p25: quantile(s, 0.25), p75: quantile(s, 0.75) });
    } else if (c !== "ID") {
      const m = new Map<string, number>();
      nn.forEach((v) => m.set(String(v), (m.get(String(v)) ?? 0) + 1));
      p.top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value, count]) => ({ value, count }));
    }
    cols[c] = p;
  }
  const total = ds.rows.length * ds.columns.length;
  return { rows: ds.rows.length, columns: ds.columns.length, columnNames: [...ds.columns], cols, duplicates: countDuplicates(ds), missingCells, missingRatio: total ? missingCells / total : 0 };
}

/* ---------- PSI ---------- */
export interface PsiResult {
  column: string;
  psi: number;
  severity: "Stable" | "Moderate Drift" | "Significant Drift";
  bins: { label: string; baseline: number; current: number }[];
}
const EPS = 1e-4;
export function psiSeverity(psi: number): PsiResult["severity"] {
  return psi < 0.1 ? "Stable" : psi <= 0.25 ? "Moderate Drift" : "Significant Drift";
}
export function psiNumeric(column: string, base: number[], cur: number[], nBins = 10): PsiResult {
  const s = [...base].sort((a, b) => a - b);
  const edges: number[] = [];
  for (let i = 1; i < nBins; i++) edges.push(quantile(s, i / nBins));
  const uniq = [...new Set(edges)];
  const idx = (x: number) => { let i = 0; while (i < uniq.length && x > uniq[i]) i++; return i; };
  const bc = new Array(uniq.length + 1).fill(0);
  const cc = new Array(uniq.length + 1).fill(0);
  base.forEach((x) => bc[idx(x)]++);
  cur.forEach((x) => cc[idx(x)]++);
  let psi = 0;
  const bins = bc.map((_, i) => {
    const b = Math.max(bc[i] / Math.max(1, base.length), EPS);
    const c = Math.max(cc[i] / Math.max(1, cur.length), EPS);
    psi += (c - b) * Math.log(c / b);
    const lo = i === 0 ? "min" : fmtShort(uniq[i - 1]);
    const hi = i === uniq.length ? "max" : fmtShort(uniq[i]);
    return { label: `${lo}–${hi}`, baseline: +(b * 100).toFixed(2), current: +(c * 100).toFixed(2) };
  });
  return { column, psi, severity: psiSeverity(psi), bins };
}
export function psiCategorical(column: string, base: string[], cur: string[]): PsiResult {
  const cats = [...new Set([...base, ...cur])];
  let psi = 0;
  const bins = cats.map((k) => {
    const b = Math.max(base.filter((x) => x === k).length / Math.max(1, base.length), EPS);
    const c = Math.max(cur.filter((x) => x === k).length / Math.max(1, cur.length), EPS);
    psi += (c - b) * Math.log(c / b);
    return { label: k, baseline: +(b * 100).toFixed(2), current: +(c * 100).toFixed(2) };
  });
  return { column, psi, severity: psiSeverity(psi), bins };
}
export function fmtShort(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
  return String(Math.round(n * 10) / 10);
}

/* ---------- KS two-sample ---------- */
export interface KsResult { column: string; statistic: number; pValue: number; alpha: number; drift: boolean }
export function ksTest(column: string, a: number[], b: number[], alpha = 0.05): KsResult {
  const x = [...a].sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  let i = 0, j = 0, d = 0;
  while (i < x.length && j < y.length) {
    const v = Math.min(x[i], y[j]);
    while (i < x.length && x[i] <= v) i++;
    while (j < y.length && y[j] <= v) j++;
    d = Math.max(d, Math.abs(i / x.length - j / y.length));
  }
  const n = x.length, m = y.length;
  const en = Math.sqrt((n * m) / (n + m));
  const lam = (en + 0.12 + 0.11 / en) * d;
  let p = 0;
  for (let k = 1; k <= 100; k++) {
    const term = 2 * (k % 2 ? 1 : -1) * Math.exp(-2 * k * k * lam * lam);
    p += term;
    if (Math.abs(term) < 1e-10) break;
  }
  p = Math.min(1, Math.max(0, p));
  if (d === 0) p = 1;
  return { column, statistic: d, pValue: p, alpha, drift: p < alpha };
}

/* ---------- Isolation Forest ---------- */
type INode = { size: number } | { f: number; split: number; l: INode; r: INode };
const cFactor = (n: number) => (n <= 1 ? 0 : 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n);

export class IsolationForest {
  trees: INode[] = [];
  sample: number;
  constructor(data: number[][], nTrees = 100, sample = 256, seed = 42) {
    const r = rng(seed);
    this.sample = Math.min(sample, data.length);
    const limit = Math.ceil(Math.log2(Math.max(2, this.sample)));
    for (let t = 0; t < nTrees; t++) {
      const s: number[][] = [];
      for (let k = 0; k < this.sample; k++) s.push(data[Math.floor(r() * data.length)]);
      this.trees.push(this.build(s, 0, limit, r));
    }
  }
  private build(X: number[][], depth: number, limit: number, r: () => number): INode {
    if (depth >= limit || X.length <= 1) return { size: X.length };
    const dims = X[0].length;
    const f = Math.floor(r() * dims);
    let mn = Infinity, mx = -Infinity;
    for (const x of X) { if (x[f] < mn) mn = x[f]; if (x[f] > mx) mx = x[f]; }
    if (mn === mx) return { size: X.length };
    const split = mn + r() * (mx - mn);
    return { f, split, l: this.build(X.filter((x) => x[f] < split), depth + 1, limit, r), r: this.build(X.filter((x) => x[f] >= split), depth + 1, limit, r) };
  }
  private path(x: number[], n: INode, d: number): number {
    if ("size" in n) return d + cFactor(n.size);
    return this.path(x, x[n.f] < n.split ? n.l : n.r, d + 1);
  }
  score(x: number[]) {
    const avg = this.trees.reduce((a, t) => a + this.path(x, t, 0), 0) / this.trees.length;
    return Math.pow(2, -avg / cFactor(this.sample));
  }
}

export interface AnomalyRecord { index: number; id: Cell; age: number; salary: number; score: number; anomaly: boolean; severity: "HIGH" | "MEDIUM" | "LOW" }
export const IF_FEATURES = ["Age", "Salary"];

export function detectAnomalies(ds: Dataset, threshold = 0.75): AnomalyRecord[] {
  const pts: { index: number; v: number[] }[] = [];
  ds.rows.forEach((r, index) => {
    const a = toNum(r.Age), s = toNum(r.Salary);
    if (a !== null && s !== null) pts.push({ index, v: [a, s] });
  });
  if (pts.length < 10) return [];
  const forest = new IsolationForest(pts.map((p) => p.v));
  return pts.map((p) => {
    const score = forest.score(p.v);
    return {
      index: p.index,
      id: ds.rows[p.index].ID ?? p.index,
      age: p.v[0],
      salary: p.v[1],
      score,
      anomaly: score >= threshold,
      severity: score >= threshold + 0.1 ? "HIGH" : score >= threshold ? "MEDIUM" : "LOW",
    };
  });
}
