import { Fragment, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toCSV, type Dataset } from "@/lib/engine/data";
import { numericValues, isMissing, type ColumnProfile } from "@/lib/engine/stats";
import { pct, type Analysis, type Issue, type ValidationCheck } from "@/lib/engine/pipeline";
import { useArc, type LogEvent, type Run } from "@/lib/store";
import { Panel, ProgressBar, SeverityBadge, Stat, StatusBadge, fmtMs, fmtTime } from "./kit";

const AX = { fontSize: 10, fill: "var(--muted-foreground)" };
const TT = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

export function histogram(xs: number[], bins = 12, lo?: number, hi?: number) {
  if (!xs.length) return [];
  const mn = lo ?? Math.min(...xs), mx = hi ?? Math.max(...xs);
  const w = (mx - mn) / bins || 1;
  const out = Array.from({ length: bins }, (_, i) => ({ label: fmtK(mn + i * w), count: 0 }));
  for (const x of xs) { if (x < mn || x > mx) continue; out[Math.min(bins - 1, Math.floor((x - mn) / w))].count++; }
  return out;
}
const fmtK = (n: number) => (Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)));
export const fmtNum = (n?: number, d = 1) => (n === undefined || Number.isNaN(n) ? "—" : Math.abs(n) >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(d));

export function DatasetSummary({ ds, a, label, subtitle, healthy }: { ds: Dataset; a: Analysis; label: string; subtitle: string; healthy: boolean }) {
  return (
    <Panel tone={healthy ? "ok" : "bad"} title={<span>{label}</span>} action={<StatusBadge status={healthy ? "HEALTHY" : "ISSUES"} label={healthy ? "Healthy" : "Issues Detected"} />}>
      <p className="-mt-2 mb-3 text-xs text-muted-foreground">{subtitle} · <span className="font-mono">{ds.name}</span></p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Rows" value={a.profile.rows.toLocaleString()} />
        <Stat label="Columns" value={a.profile.columns} />
        <Stat label="Missing" value={pct(a.profile.missingRatio)} tone={a.profile.missingRatio > 0.02 ? "bad" : undefined} />
        <Stat label="Duplicates" value={a.profile.duplicates} tone={a.profile.duplicates ? "bad" : undefined} />
        <Stat label="Anomalies" value={a.anomalyCount} tone={a.anomalyCount > 5 ? "warn" : undefined} />
        <Stat label="Quality" value={`${a.quality.score}%`} tone={a.quality.score >= 85 ? "ok" : "bad"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ds.columns.map((c) => (
          <span key={c} className="rounded border bg-muted px-2 py-0.5 font-mono text-[11px]">{c}: <span className={cn(a.schema.some((s) => s.column === c) ? "text-destructive font-semibold" : "text-muted-foreground")}>{a.profile.cols[c].type}</span></span>
        ))}
      </div>
    </Panel>
  );
}

export function DataPreview({ ds, highlight, limit = 8 }: { ds: Dataset; highlight?: boolean; limit?: number }) {
  const rows = useMemo(() => {
    if (!highlight) return ds.rows.slice(0, limit).map((r) => ({ r, bad: false }));
    const isBad = (r: Dataset["rows"][number]) => ds.columns.some((c) => isMissing(r[c])) || typeof r.Age === "string" || (typeof r.Salary === "number" && r.Salary > 400000);
    const bad = ds.rows.filter(isBad).slice(0, Math.ceil(limit / 2));
    const good = ds.rows.filter((r) => !isBad(r)).slice(0, limit - bad.length);
    return [...good.slice(0, 3), ...bad, ...good.slice(3)].map((r) => ({ r, bad: bad.includes(r) }));
  }, [ds, highlight, limit]);
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted font-mono uppercase text-muted-foreground"><tr>{ds.columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map(({ r, bad }, i) => (
            <tr key={i} className={cn("border-t", bad && "bg-danger-soft/60")}>
              {ds.columns.map((c) => {
                const v = r[c];
                const odd = isMissing(v) || (typeof v === "string" && c === "Age") || (c === "Salary" && typeof v === "number" && v > 400000);
                return <td key={c} className={cn("whitespace-nowrap px-3 py-1.5 font-mono", odd && "font-semibold text-destructive")}>{isMissing(v) ? "null" : typeof v === "string" && c === "Age" ? `"${v}"` : String(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DistributionCharts({ ds, a }: { ds: Dataset; a: Analysis }) {
  const age = histogram(numericValues(ds, "Age"), 10, 18, 70);
  const sal = histogram(numericValues(ds, "Salary"), 12, 15000, 140000);
  const dept = (a.profile.cols.Department?.top ?? []).map((t) => ({ label: t.value, count: t.count }));
  const miss = ds.columns.map((c) => ({ label: c, pct: +(a.profile.cols[c].missingRatio * 100).toFixed(2) }));
  const Chart = ({ title, data, k = "count", color = "var(--chart-1)" }: { title: string; data: object[]; k?: string; color?: string }) => (
    <div className="rounded-lg border p-3">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">{title}</div>
      <div className="h-40">
        <ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="label" tick={AX} interval="preserveStartEnd" /><YAxis tick={AX} width={32} /><Tooltip {...TT} /><Bar dataKey={k} fill={color} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
    </div>
  );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Chart title="Age distribution" data={age} />
      <Chart title="Salary distribution (15k–140k)" data={sal} color="var(--chart-5)" />
      <Chart title="Missing values (%)" data={miss} k="pct" color="var(--chart-2)" />
      <Chart title="Department distribution" data={dept} color="var(--chart-3)" />
    </div>
  );
}

function Delta({ before, after, betterLower = true, fmt = (n: number) => String(n) }: { before: number; after: number; betterLower?: boolean; fmt?: (n: number) => string }) {
  const up = after > before;
  const same = after === before;
  const bad = !same && (up === betterLower);
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-xs font-semibold", same ? "text-muted-foreground" : bad ? "text-destructive" : "text-success")}>
      {same ? "=" : up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {fmt(before)} → {fmt(after)}
    </span>
  );
}

export function ComparisonPanel({ before, after, labels = ["BEFORE UPDATE", "AFTER UPDATE"] }: { before: Analysis; after: Analysis; labels?: [string, string] }) {
  const rows: { k: string; b: string; a: string; d: React.ReactNode }[] = [
    { k: "Rows", b: before.profile.rows.toLocaleString(), a: after.profile.rows.toLocaleString(), d: <Delta before={before.profile.rows} after={after.profile.rows} betterLower={false} fmt={(n) => n.toLocaleString()} /> },
    { k: "Columns", b: String(before.profile.columns), a: String(after.profile.columns), d: after.schema.filter((s) => s.change === "NEW").length ? <span className="font-mono text-xs font-semibold text-warning">NEW: {after.schema.filter((s) => s.change === "NEW").map((s) => s.column).join(", ")}</span> : after.schema.some((s) => s.change === "REMOVED") ? <span className="font-mono text-xs font-semibold text-destructive">REMOVED</span> : <span className="font-mono text-xs text-muted-foreground">=</span> },
    { k: "Data Types", b: "consistent", a: after.schema.filter((s) => s.change === "TYPE").length ? after.schema.filter((s) => s.change === "TYPE").map((s) => `${s.column}: ${s.after}`).join(", ") : "consistent", d: after.schema.some((s) => s.change === "TYPE") ? <span className="font-mono text-xs font-semibold text-destructive">CHANGED</span> : <span className="font-mono text-xs text-muted-foreground">=</span> },
    { k: "Missing Values", b: pct(before.profile.missingRatio), a: pct(after.profile.missingRatio), d: <Delta before={+(before.profile.missingRatio * 100).toFixed(1)} after={+(after.profile.missingRatio * 100).toFixed(1)} fmt={(n) => `${n}%`} /> },
    { k: "Duplicates", b: String(before.profile.duplicates), a: String(after.profile.duplicates), d: <Delta before={before.profile.duplicates} after={after.profile.duplicates} /> },
    { k: "Invalid Records", b: String(before.invalid.length), a: String(after.invalid.length), d: <Delta before={before.invalid.length} after={after.invalid.length} /> },
    { k: "Distribution (max PSI)", b: Math.max(0, ...before.psi.map((p) => p.psi)).toFixed(3), a: Math.max(0, ...after.psi.map((p) => p.psi)).toFixed(3), d: <Delta before={+Math.max(0, ...before.psi.map((p) => p.psi)).toFixed(3)} after={+Math.max(0, ...after.psi.map((p) => p.psi)).toFixed(3)} /> },
    { k: "Anomalies", b: String(before.anomalyCount), a: String(after.anomalyCount), d: <Delta before={before.anomalyCount} after={after.anomalyCount} /> },
    { k: "Data Quality", b: `${before.quality.score}%`, a: `${after.quality.score}%`, d: <Delta before={before.quality.score} after={after.quality.score} betterLower={false} fmt={(n) => `${n}%`} /> },
  ];
  const ok = (a: Analysis) => a.quality.score >= 85 && !a.schema.some((s) => s.change !== "NULLABILITY");
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="grid grid-cols-[1fr_1fr] md:grid-cols-[1.1fr_1fr_1fr_1.2fr]">
        <div className="hidden bg-muted p-3 font-mono text-[11px] uppercase text-muted-foreground md:block">Metric</div>
        <div className="bg-success-soft p-3"><div className="font-mono text-[11px] font-bold">{labels[0]}</div><StatusBadge className="mt-1" status={ok(before) ? "HEALTHY" : "ISSUES"} label={ok(before) ? "Healthy" : "Issues"} /></div>
        <div className={cn("p-3", ok(after) ? "bg-success-soft" : "bg-danger-soft")}><div className="font-mono text-[11px] font-bold">{labels[1]}</div><StatusBadge className="mt-1" status={ok(after) ? "HEALTHY" : "ISSUES"} label={ok(after) ? "Healthy" : "Issues Detected"} /></div>
        <div className="hidden bg-muted p-3 font-mono text-[11px] uppercase text-muted-foreground md:block">Change</div>
        {rows.map((r) => (
          <div key={r.k} className="contents">
            <div className="col-span-2 border-t bg-muted/40 px-3 pt-2 text-xs font-semibold md:col-span-1 md:bg-transparent md:py-2.5">{r.k}</div>
            <div className="px-3 py-1.5 font-mono text-xs md:border-t md:py-2.5">{r.b}</div>
            <div className="px-3 py-1.5 font-mono text-xs md:border-t md:py-2.5">{r.a}</div>
            <div className="col-span-2 px-3 pb-2 md:col-span-1 md:border-t md:py-2.5">{r.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IssueCard({ issue, index }: { issue: Issue; index: number }) {
  const active = issue.status === "PROCESSING" || issue.status === "VALIDATING";
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-card transition-all", active && "pulse-ring border-primary", issue.status === "RESOLVED" && "border-success/40", issue.status === "FAILED" && "border-destructive/50")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
          <h3 className="font-semibold">{issue.title}</h3>
          <SeverityBadge s={issue.severity} />
        </div>
        <StatusBadge status={issue.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs md:grid-cols-4">
        <div><dt className="text-muted-foreground">Before</dt><dd className="font-mono font-semibold">{issue.before}</dd></div>
        <div><dt className="text-muted-foreground">After update</dt><dd className="font-mono font-semibold text-destructive">{issue.after}</dd></div>
        <div><dt className="text-muted-foreground">Detected by</dt><dd className="font-medium">{issue.detectedBy}</dd></div>
        <div><dt className="text-muted-foreground">Records</dt><dd className="font-mono font-semibold">{issue.affected.toLocaleString()}</dd></div>
      </dl>
      <div className="mt-3 rounded-lg bg-muted p-3 text-xs">
        <div className="grid gap-1 md:grid-cols-2">
          <div><span className="font-mono text-[10px] uppercase text-muted-foreground">Cause · </span>{issue.cause}</div>
          <div><span className="font-mono text-[10px] uppercase text-muted-foreground">Recommended action · </span><span className="font-semibold text-primary">{issue.action}</span></div>
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">Rule: {issue.rule}</div>
      </div>
      {(active || issue.progress > 0) && <div className="mt-3"><ProgressBar value={issue.progress} active={active} tone={issue.status === "RESOLVED" ? "ok" : issue.status === "FAILED" ? "bad" : undefined} /></div>}
      {issue.validation && <div className={cn("mt-2 text-xs", issue.status === "RESOLVED" ? "text-success" : "text-warning")}>{issue.validation}</div>}
    </div>
  );
}

export function RemediationFlowCard({ issue }: { issue: Issue }) {
  const s = issue.status;
  const reached = (k: number) => {
    const order = ["DETECTED", "PENDING", "PROCESSING", "VALIDATING", "RESOLVED"];
    const i = order.indexOf(s);
    if (s === "RESOLVED") return true;
    if (s === "QUARANTINED" || s === "REQUIRES_REVIEW" || s === "FAILED") return k <= 1;
    return i >= k + 1;
  };
  const Box = ({ label, children, on, tone }: { label: string; children: React.ReactNode; on: boolean; tone?: "ok" | "bad" | "info" }) => (
    <div className={cn("min-w-[140px] flex-1 rounded-lg border p-3 transition-all", !on && "opacity-40", tone === "ok" && on && "border-success/40 bg-success-soft", tone === "bad" && "border-destructive/30 bg-danger-soft", tone === "info" && on && "border-info/30 bg-info-soft")}>
      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
  const ex = issue.example;
  const terminal = s === "QUARANTINED" || s === "REQUIRES_REVIEW" || s === "FAILED";
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><h3 className="text-sm font-semibold">{issue.title}</h3><SeverityBadge s={issue.severity} /></div>
        <StatusBadge status={s} />
      </div>
      <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
        <Box label="Before" on tone="bad"><span className="font-mono">{ex ? `${ex.field}: ${ex.before}` : issue.after}</span></Box>
        <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-muted-foreground lg:rotate-0" />
        <Box label="🔄 Processing" on={s !== "DETECTED" && s !== "PENDING"} tone="info">{issue.action}</Box>
        <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-muted-foreground lg:rotate-0" />
        {terminal ? (
          <Box label={s.replace("_", " ")} on tone="bad">{issue.validation ?? "Held for review"}</Box>
        ) : (
          <>
            <Box label="After" on={reached(2)} tone="ok"><span className="font-mono">{ex?.after ? `${ex.field}: ${ex.after}` : `${issue.affected.toLocaleString()} records fixed`}</span></Box>
            <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-muted-foreground lg:rotate-0" />
            <Box label="Validation" on={s === "VALIDATING" || s === "RESOLVED"} tone={s === "RESOLVED" ? "ok" : "info"}>{s === "RESOLVED" ? "PASSED" : s === "VALIDATING" ? "Running…" : "—"}</Box>
            <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-muted-foreground lg:rotate-0" />
            <Box label="Result" on={s === "RESOLVED"} tone="ok">✅ RESOLVED</Box>
          </>
        )}
      </div>
      {issue.startedAt && issue.resolvedAt && <div className="mt-2 font-mono text-[11px] text-muted-foreground">Processing time {fmtMs(issue.resolvedAt - issue.startedAt)} · {issue.detectedBy}</div>}
    </div>
  );
}

export function MetricsProof({ before, after }: { before: Analysis; after: Analysis }) {
  const schemaN = (a: Analysis) => a.schema.filter((s) => s.change !== "NULLABILITY").length;
  const items = [
    { k: "Anomalies", b: before.anomalyCount, a: after.anomalyCount, f: String },
    { k: "Missing Values", b: before.profile.missingRatio * 100, a: after.profile.missingRatio * 100, f: (n: number) => `${n.toFixed(1)}%` },
    { k: "Duplicates", b: before.profile.duplicates, a: after.profile.duplicates, f: String },
    { k: "Schema Issues", b: schemaN(before), a: schemaN(after), f: String },
    { k: "Invalid Records", b: before.invalid.length, a: after.invalid.length, f: String },
    { k: "Data Quality", b: before.quality.score, a: after.quality.score, f: (n: number) => `${n}%`, up: true },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {items.map((m) => {
        const good = m.up ? m.a >= m.b : m.a <= m.b;
        return (
          <div key={m.k} className={cn("rounded-lg border p-3", good ? "border-success/30 bg-success-soft" : "border-destructive/30 bg-danger-soft")}>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{m.k}</div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono"><span className="text-sm text-destructive line-through decoration-1">{m.f(m.b)}</span><ArrowRight className="h-3 w-3" /><span className={cn("text-xl font-bold", good ? "text-success" : "text-destructive")}>{m.f(m.a)}</span></div>
          </div>
        );
      })}
    </div>
  );
}

export function QualityTrio() {
  const { baseAnalysis, currentAnalysis, remediatedAnalysis } = useArc();
  const items = [
    { k: "BEFORE UPDATE", v: baseAnalysis.quality.score },
    { k: "AFTER UPDATE", v: currentAnalysis?.quality.score },
    { k: "AFTER REMEDIATION", v: remediatedAnalysis?.quality.score },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((i) => (
        <div key={i.k} className="rounded-lg border bg-card p-3">
          <div className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground">{i.k}</div>
          <div className={cn("mt-1 font-mono text-2xl font-bold md:text-3xl", i.v === undefined ? "text-muted-foreground/40" : i.v >= 85 ? "text-success" : i.v >= 70 ? "text-warning" : "text-destructive")}>{i.v === undefined ? "—" : `${i.v}%`}</div>
          <div className="mt-2"><ProgressBar value={i.v ?? 0} tone={i.v !== undefined && i.v >= 85 ? "ok" : i.v !== undefined && i.v < 70 ? "bad" : undefined} /></div>
        </div>
      ))}
    </div>
  );
}

export function ValidationTable({ checks }: { checks: ValidationCheck[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted font-mono uppercase text-muted-foreground"><tr><th className="px-3 py-2">Check</th><th className="px-3 py-2">Before remediation</th><th className="px-3 py-2">After remediation</th><th className="px-3 py-2">Result</th></tr></thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.name} className="border-t">
              <td className="px-3 py-2 font-medium">{c.name}</td>
              <td className="px-3 py-2 font-mono"><span className={c.beforePassed ? "" : "text-destructive"}>{c.before}</span> {c.beforePassed ? "🟢" : "🔴"}</td>
              <td className="px-3 py-2 font-mono">{c.after}</td>
              <td className="px-3 py-2"><StatusBadge status={c.passed ? "PASSED" : "FAILED"} label={c.passed ? "Passed" : "Failed"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LogsTable({ logs, limit }: { logs: LogEvent[]; limit?: number }) {
  const list = limit ? logs.slice(0, limit) : logs;
  if (!list.length) return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No events yet. Run the pipeline to generate logs.</div>;
  const tone = (s: string) => /resolved|success|released|recovered|completed|clean/i.test(s) ? "text-success" : /fail|block/i.test(s) ? "text-destructive" : /detected/i.test(s) ? "text-destructive" : /processing|validating|started/i.test(s) ? "text-info" : "text-warning";
  return (
    <div className="max-h-[520px] overflow-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-muted font-mono uppercase text-muted-foreground"><tr>{["Timestamp", "Event", "Component", "Issue", "Detection Method", "Action", "Records", "Status", "Duration"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}</tr></thead>
        <tbody className="font-mono">
          {list.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{fmtTime(l.ts)}</td>
              <td className="whitespace-nowrap px-3 py-1.5 font-semibold">{l.event}</td>
              <td className="whitespace-nowrap px-3 py-1.5">{l.component}</td>
              <td className="whitespace-nowrap px-3 py-1.5">{l.issue}</td>
              <td className="whitespace-nowrap px-3 py-1.5">{l.method}</td>
              <td className="max-w-[280px] truncate px-3 py-1.5" title={l.action}>{l.action}</td>
              <td className="px-3 py-1.5">{l.records.toLocaleString()}</td>
              <td className={cn("whitespace-nowrap px-3 py-1.5 font-semibold", tone(l.status))}>{l.status}</td>
              <td className="px-3 py-1.5">{fmtMs(l.durationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RunsTable({ runs }: { runs: Run[] }) {
  if (!runs.length) return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No runs yet.</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted font-mono uppercase text-muted-foreground"><tr>{["Run ID", "Start", "End", "Trigger", "Version", "Detected", "Resolved", "Validation", "Recovery", "MTTD", "MTTR", "Quality", "Status"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}</tr></thead>
        <tbody className="font-mono">
          {runs.map((r) => (
            <tr key={r.id + r.start} className="border-t">
              <td className="whitespace-nowrap px-3 py-2 font-semibold">{r.id}</td>
              <td className="whitespace-nowrap px-3 py-2">{fmtTime(r.start)}</td>
              <td className="whitespace-nowrap px-3 py-2">{fmtTime(r.end)}</td>
              <td className="whitespace-nowrap px-3 py-2"><span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", r.trigger === "APPLICATION UPDATE" ? "bg-accent text-primary" : "bg-secondary text-secondary-foreground")}>{r.trigger}</span></td>
              <td className="px-3 py-2">{r.version}</td>
              <td className="px-3 py-2">{r.detected}</td>
              <td className="px-3 py-2">{r.resolved}{r.quarantined ? ` (+${r.quarantined} quarantined)` : ""}</td>
              <td className={cn("px-3 py-2 font-semibold", r.validation === "PASSED" ? "text-success" : r.validation === "FAILED" ? "text-destructive" : "text-muted-foreground")}>{r.validation}</td>
              <td className="whitespace-nowrap px-3 py-2">{r.recovery}</td>
              <td className="px-3 py-2">{fmtMs(r.mttd)}</td>
              <td className="px-3 py-2">{fmtMs(r.mttr)}</td>
              <td className="whitespace-nowrap px-3 py-2">{r.qualityBefore}% → {r.qualityAfter}%</td>
              <td className="whitespace-nowrap px-3 py-2"><StatusBadge status={r.status === "RECOVERED" ? "RESOLVED" : r.status === "FAILED" ? "FAILED" : "REQUIRES_REVIEW"} label={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DatasetExplorer() {
  const { baseline, baseAnalysis, current, currentAnalysis, remediated, remediatedAnalysis } = useArc();
  const [tab, setTab] = useState<"baseline" | "current" | "remediated">("baseline");
  const opts = [
    { id: "baseline" as const, label: "BASELINE", sub: "Previous / Normal", ds: baseline, a: baseAnalysis },
    { id: "current" as const, label: "CURRENT", sub: "After Update / Issues", ds: current, a: currentAnalysis },
    { id: "remediated" as const, label: "REMEDIATED", sub: "After Automatic Fix", ds: remediated, a: remediatedAnalysis },
  ];
  const sel = opts.find((o) => o.id === tab)!;
  const download = () => {
    if (!sel.ds) return;
    const url = URL.createObjectURL(new Blob([toCSV(sel.ds)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = sel.ds.name; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {opts.map((o) => (
          <button key={o.id} disabled={!o.ds} onClick={() => setTab(o.id)} className={cn("rounded-lg border p-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40", tab === o.id ? "border-primary bg-accent" : "bg-card hover:bg-muted")}>
            <div className="font-mono text-xs font-bold">{o.label}</div>
            <div className="text-[11px] text-muted-foreground">{o.sub}</div>
          </button>
        ))}
      </div>
      {sel.ds && sel.a ? (
        <div className="space-y-4">
          <DatasetSummary ds={sel.ds} a={sel.a} label={`${sel.label} DATASET`} subtitle={sel.sub} healthy={sel.a.quality.score >= 85 && !sel.a.schema.some((s) => s.change !== "NULLABILITY")} />
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Data preview</h3><Button variant="outline" size="sm" onClick={download}><Download /> CSV</Button></div>
          <DataPreview ds={sel.ds} highlight={tab === "current"} />
          <DistributionCharts ds={sel.ds} a={sel.a} />
        </div>
      ) : <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Not available yet.</div>}
    </div>
  );
}

export function ProfileTable({ base, cur }: { base: Analysis; cur?: Analysis | null }) {
  const cols = [...new Set([...base.profile.columnNames, ...(cur?.profile.columnNames ?? [])])];
  const cell = (p?: ColumnProfile) => p ? [p.type, pct(p.missingRatio), p.unique.toLocaleString(), fmtNum(p.mean), fmtNum(p.median), p.variance !== undefined ? fmtNum(p.variance, 1) : "—", fmtNum(p.min, 0), fmtNum(p.max, 0)] : Array(8).fill("—");
  const H = ["Type", "Missing", "Unique", "Mean", "Median", "Variance", "Min", "Max"];
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted font-mono uppercase text-muted-foreground"><tr><th className="px-3 py-2">Column</th><th className="px-3 py-2">Dataset</th>{H.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody className="font-mono">
          {cols.map((c) => (
            <Fragment key={c}>
              <tr key={c + "b"} className="border-t"><td rowSpan={cur ? 2 : 1} className="px-3 py-1.5 font-sans font-semibold">{c}</td><td className="px-3 py-1.5 text-success">baseline</td>{cell(base.profile.cols[c]).map((v, i) => <td key={i} className="whitespace-nowrap px-3 py-1.5">{v}</td>)}</tr>
              {cur && <tr key={c + "c"} className="bg-muted/30"><td className="px-3 py-1.5 text-destructive">current</td>{cell(cur.profile.cols[c]).map((v, i) => { const b = cell(base.profile.cols[c])[i]; return <td key={i} className={cn("whitespace-nowrap px-3 py-1.5", v !== b && (i === 0 || i === 1) && "font-semibold text-destructive")}>{v}</td>; })}</tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PsiBins({ bins }: { bins: { label: string; baseline: number; current: number }[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer><BarChart data={bins}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="label" tick={AX} interval={0} angle={-25} textAnchor="end" height={45} /><YAxis tick={AX} width={30} unit="%" /><Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="baseline" fill="var(--chart-3)" radius={[2, 2, 0, 0]} /><Bar dataKey="current" fill="var(--chart-2)" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer>
    </div>
  );
}
