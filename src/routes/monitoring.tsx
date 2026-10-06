import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useArc } from "@/lib/store";
import { PageHeader, Panel, Stat, fmtMs } from "@/components/arc/kit";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring & Observability — DriftShield-Arc" },
      { name: "description", content: "Pipeline health, drift incidents, anomalies, MTTD, MTTR and auto-resolution rate across runs." },
      { property: "og:title", content: "Monitoring & Observability — DriftShield-Arc" },
      { property: "og:description", content: "Observability metrics computed from real pipeline timestamps." },
    ],
  }),
  component: MonitoringPage,
});

const AX = { fontSize: 10, fill: "var(--muted-foreground)" };
const TT = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

export function useMetrics() {
  const { runs, logs } = useArc();
  const withIssues = runs.filter((r) => r.detected > 0);
  const detected = runs.reduce((a, r) => a + r.detected, 0);
  const resolved = runs.reduce((a, r) => a + r.resolved, 0);
  return {
    runs, logs,
    mttd: withIssues.length ? withIssues.reduce((a, r) => a + r.mttd, 0) / withIssues.length : 0,
    mttr: withIssues.filter((r) => r.mttr).length ? withIssues.filter((r) => r.mttr).reduce((a, r) => a + r.mttr, 0) / withIssues.filter((r) => r.mttr).length : 0,
    auto: detected ? (resolved / detected) * 100 : 0,
    detected, resolved,
    failed: runs.filter((r) => r.status === "FAILED").length,
    recovered: runs.filter((r) => r.recovery === "RECOVERED").length,
  };
}

function MonitoringPage() {
  const m = useMetrics();
  const s = useArc();
  const chron = [...m.runs].reverse().map((r, i) => ({ run: `#${i + 1}`, detected: r.detected, resolved: r.resolved, before: r.qualityBefore, after: r.qualityAfter, anomBefore: r.anomaliesBefore, anomAfter: r.anomaliesAfter, recovery: +((r.end - r.start) / 1000).toFixed(1), mttr: +(r.mttr / 1000).toFixed(2) }));
  const count = (e: string) => m.logs.filter((l) => l.event === e).length;
  const C = ({ title, children }: { title: string; children: React.ReactElement }) => <Panel title={title}><div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div></Panel>;
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Observability" title="Monitoring & Observability" subtitle="All metrics are derived from timestamps recorded during pipeline execution." />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Pipeline health" value={s.phase === "failed" ? "DEGRADED" : s.running ? "RUNNING" : "HEALTHY"} tone={s.phase === "failed" ? "bad" : "ok"} />
        <Stat label="MTTD" value={fmtMs(m.mttd)} hint="Mean Time To Detect" />
        <Stat label="MTTR" value={fmtMs(m.mttr)} hint="Mean Time To Recover" />
        <Stat label="Auto-resolved" value={`${m.auto.toFixed(0)}%`} tone="ok" />
        <Stat label="Drift incidents" value={count("DRIFT DETECTION") + count("SCHEMA DRIFT")} />
        <Stat label="Anomaly events" value={count("ANOMALY DETECTION")} />
        <Stat label="Recoveries" value={m.recovered} tone="ok" />
        <Stat label="Failed runs" value={m.failed} tone={m.failed ? "bad" : undefined} />
      </div>
      {chron.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No runs yet — trigger an update or run the pipeline to populate charts.</div> : (
        <div className="grid gap-5 lg:grid-cols-2">
          <C title="Drift / issue incidents per run"><BarChart data={chron}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="run" tick={AX} /><YAxis tick={AX} width={28} /><Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="detected" fill="var(--chart-2)" /><Bar dataKey="resolved" fill="var(--chart-3)" /></BarChart></C>
          <C title="Data quality improvement"><LineChart data={chron}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="run" tick={AX} /><YAxis tick={AX} width={28} domain={[0, 100]} /><Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line dataKey="before" stroke="var(--chart-2)" strokeWidth={2} /><Line dataKey="after" stroke="var(--chart-3)" strokeWidth={2} /></LineChart></C>
          <C title="Anomaly count (before / after)"><BarChart data={chron}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="run" tick={AX} /><YAxis tick={AX} width={28} /><Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="anomBefore" fill="var(--chart-4)" /><Bar dataKey="anomAfter" fill="var(--chart-1)" /></BarChart></C>
          <C title="Recovery time (s) & MTTR (s)"><LineChart data={chron}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="run" tick={AX} /><YAxis tick={AX} width={28} /><Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line dataKey="recovery" stroke="var(--chart-5)" strokeWidth={2} /><Line dataKey="mttr" stroke="var(--chart-1)" strokeWidth={2} /></LineChart></C>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Remediation events" value={m.logs.filter((l) => l.event === "REMEDIATION").length} />
        <Stat label="Validation events" value={count("VALIDATION")} />
        <Stat label="Recovery events" value={count("RECOVERY")} />
        <Stat label="Current quality" value={`${(s.remediatedAnalysis ?? s.currentAnalysis ?? s.baseAnalysis).quality.score}%`} />
      </div>
    </div>
  );
}
