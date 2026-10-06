export type Cell = string | number | null;
export type Row = Record<string, Cell>;
export interface Dataset {
  name: string;
  columns: string[];
  rows: Row[];
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  "John", "Priya", "Karthik", "Anitha", "Rahul", "Divya", "Suresh", "Meena", "Arun", "Lakshmi",
  "Vijay", "Deepa", "Ganesh", "Kavya", "Manoj", "Revathi", "Ravi", "Sneha", "Ashok", "Nithya",
  "Prakash", "Swathi", "Hari", "Keerthana", "Senthil", "Pooja", "Dinesh", "Harini", "Bala", "Janani",
];
const DEPTS = ["IT", "HR", "Finance", "Sales", "Operations", "Marketing"];
const DEPT_W = [0.3, 0.1, 0.15, 0.2, 0.15, 0.1];
const DEPT_BONUS: Record<string, number> = { IT: 9000, HR: -2000, Finance: 6000, Sales: 2000, Operations: 0, Marketing: 1000 };
const LOCS = ["Chennai", "Madurai", "Coimbatore", "Bengaluru", "Hyderabad", "Trichy"];

function normal(r: () => number) {
  const u = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
function pickW<T>(r: () => number, items: T[], w: number[]) {
  let x = r();
  for (let i = 0; i < items.length; i++) {
    x -= w[i];
    if (x <= 0) return items[i];
  }
  return items[items.length - 1];
}

function makeRow(r: () => number, id: number): Row {
  const age = Math.min(60, Math.max(21, Math.round(34 + normal(r) * 7)));
  const dept = pickW(r, DEPTS, DEPT_W);
  const salary = Math.max(18000, Math.round((30000 + (age - 21) * 1300 + DEPT_BONUS[dept] + normal(r) * 7000) / 100) * 100);
  return {
    ID: id,
    Name: NAMES[Math.floor(r() * NAMES.length)],
    Age: age,
    Salary: salary,
    Department: dept,
    Location: LOCS[Math.floor(r() * LOCS.length)],
  };
}

export const BASE_COLUMNS = ["ID", "Name", "Age", "Salary", "Department", "Location"];

export function makeBaseline(n = 2000, seed = 7): Dataset {
  const r = rng(seed);
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const row = makeRow(r, i + 1);
    if (r() < 0.005) row.Salary = null;
    rows.push(row);
  }
  return { name: "employees_baseline_v1.csv", columns: [...BASE_COLUMNS], rows };
}

export type ScenarioId = "normal" | "schema" | "missing" | "drift" | "outlier" | "duplicates" | "combined";

export const SCENARIOS: { id: ScenarioId; label: string; description: string; effects: string[] }[] = [
  { id: "normal", label: "Normal Data", description: "New batch drawn from the same distribution. No problems expected.", effects: [] },
  { id: "schema", label: "Schema Change", description: "Age arrives as text, a new Experience column appears, some values cannot be cast.", effects: ["Schema", "Data Types"] },
  { id: "missing", label: "Missing Value Spike", description: "Salary and Department lose values after the update.", effects: ["Missing Values"] },
  { id: "drift", label: "Distribution Drift", description: "Salary distribution shifts upward by ~38%.", effects: ["Distribution"] },
  { id: "outlier", label: "Outlier Burst", description: "15 records with extreme salaries are injected.", effects: ["Anomalies"] },
  { id: "duplicates", label: "Duplicate Records", description: "120 records are re-sent by the updated source.", effects: ["Duplicates"] },
  { id: "combined", label: "Combined Update Scenario", description: "All of the above in one release — the default demo.", effects: ["Schema", "Data Types", "Missing Values", "Distribution", "Anomalies", "Duplicates"] },
];

export function makeCurrent(scenario: ScenarioId, n = 2000, seed = 99): Dataset {
  const r = rng(seed);
  const all = scenario === "combined";
  const f = {
    schema: all || scenario === "schema",
    missing: all || scenario === "missing",
    drift: all || scenario === "drift",
    outlier: all || scenario === "outlier",
    dup: all || scenario === "duplicates",
    invalid: all || scenario === "schema",
  };
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const row = makeRow(r, 10001 + i);
    if (f.drift && typeof row.Salary === "number") row.Salary = Math.round((row.Salary * 1.38) / 100) * 100;
    if (r() < 0.005) row.Salary = null;
    if (f.missing) {
      if (r() < 0.08) row.Salary = null;
      if (r() < 0.035) row.Department = null;
    }
    rows.push(row);
  }
  if (f.outlier) {
    for (let k = 0; k < 15; k++) {
      const row = rows[Math.floor(r() * rows.length)];
      row.Salary = Math.round((850000 + r() * 400000) / 1000) * 1000;
    }
  }
  if (f.invalid) {
    const bad: Cell[] = ["N/A", "unknown", "-4", "142", "187", "-12", "N/A", "999", "0", "-1", "155", "N/A"];
    for (const v of bad) {
      const row = rows[Math.floor(r() * rows.length)];
      row.Age = f.schema ? v : Number.isFinite(Number(v)) ? Number(v) : null;
    }
  }
  const columns = [...BASE_COLUMNS];
  if (f.schema) {
    for (const row of rows) {
      if (typeof row.Age === "number") row.Age = String(row.Age);
      const a = Number(row.Age);
      row.Experience = Number.isFinite(a) && a > 21 && a < 80 ? Math.max(0, Math.round(a - 22 - r() * 3)) : null;
    }
    columns.push("Experience");
  }
  if (f.dup) {
    for (let k = 0; k < 120; k++) rows.push({ ...rows[Math.floor(r() * n)] });
  }
  return { name: `employees_incoming_v2_${scenario}.csv`, columns, rows };
}

export function parseCSV(text: string, name: string): Dataset {
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { cur.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      cur.push(field); field = "";
      if (cur.some((c) => c !== "")) lines.push(cur);
      cur = [];
    } else field += ch;
  }
  cur.push(field);
  if (cur.some((c) => c !== "")) lines.push(cur);
  const [header, ...body] = lines;
  if (!header) throw new Error("Empty CSV");
  const columns = header.map((h) => h.trim());
  const rows = body.map((cells) => {
    const row: Row = {};
    columns.forEach((c, i) => {
      const v = (cells[i] ?? "").trim();
      row[c] = v === "" ? null : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
    });
    return row;
  });
  return { name, columns, rows };
}

export function toCSV(ds: Dataset) {
  const esc = (v: Cell) => (v === null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [ds.columns.join(","), ...ds.rows.map((r) => ds.columns.map((c) => esc(r[c] ?? null)).join(","))].join("\n");
}

export const cloneDataset = (ds: Dataset, name?: string): Dataset => ({
  name: name ?? ds.name,
  columns: [...ds.columns],
  rows: ds.rows.map((r) => ({ ...r })),
});
