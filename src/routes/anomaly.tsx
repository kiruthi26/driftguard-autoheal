import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useArc } from "@/lib/store";
import { EmptyState, PageHeader, Panel, SeverityBadge, Stat, StatusBadge } from "@/components/arc/kit";

export const Route = createFileRoute("/anomaly")({
  head: () => ({
    meta: [
      { title: "Anomaly Detection — DriftShield-Arc" },
      { name: "description", content: "Isolation Forest anomaly scores on Age and Salary for baseline, current and remediated data." },
      { property: "og:title", content: "Anomaly Detection — DriftShield-Arc" },
      { property: "og:description", content: "Isolation Forest (100 trees, ψ=256) anomaly detection." },
    ],
  }),
  component: AnomalyPage,
});

function AnomalyPage() {
  const { baseAnalysis, currentAnalysis: a, remediatedAnalysis: r, settings } = useArc();
  const src = a ?? baseAnalysis;
  const normal = src.anomalies.filter((x) => !x.anomaly).filter((_, i) => i % 3 === 0).map((x) => ({ x: x.age, y: x.salary }));
  const anom = src.anomalies.filter((x) => x.anomaly).map((x) => ({ x: x.age, y: x.salary }));
  const top = [...src.anomalies].sort((p, q) => q.score - p.score).slice(0, 25);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Algorithm C" title="Anomaly Detection" subtitle={`Isolation Forest — 100 trees, sub-sample ψ = 256, features [Age, Salary]. s(x) = 2^(−E[h(x)] / c(ψ)); flagged when s ≥ ${settings.ifThreshold}.`} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Baseline anomalies" value={baseAnalysis.anomalyCount} />
        <Stat label="Current anomalies" value={a?.anomalyCount ?? "—"} tone={a && a.anomalyCount > baseAnalysis.anomalyCount + 3 ? "bad" : undefined} />
        <Stat label="After remediation" value={r?.anomalyCount ?? "—"} tone={r ? "ok" : undefined} />
      </div>
      {!a && <EmptyState title="Showing baseline only" body="Run an application update to score incoming data." cta />}
      <Panel title={`Age vs Salary — ${a ? "current" : "baseline"} data`}>
        <div className="h-80">
          <ResponsiveContainer>
            <ScatterChart margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" name="Age" type="number" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <YAxis dataKey="y" name="Salary" type="number" tick={{ fontSize: 10 }} width={60} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Scatter name="Normal" data={normal} fill="var(--chart-1)" fillOpacity={0.35} />
              <Scatter name="Anomaly" data={anom} fill="var(--chart-2)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Top anomaly scores">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="font-mono text-[11px] uppercase text-muted-foreground"><tr><th className="py-2">Record ID</th><th>Age</th><th>Salary</th><th>Anomaly score</th><th>Status</th><th>Severity</th></tr></thead>
          <tbody className="font-mono">{top.map((t) => (
            <tr key={t.index} className="border-t"><td className="py-1.5">{String(t.id)}</td><td>{t.age}</td><td>{t.salary.toLocaleString()}</td><td className={t.anomaly ? "font-bold text-destructive" : ""}>{t.score.toFixed(3)}</td><td>{t.anomaly ? <StatusBadge status="DETECTED" label="Anomaly" /> : <span className="text-xs text-muted-foreground">normal</span>}</td><td><SeverityBadge s={t.severity} /></td></tr>
          ))}</tbody>
        </table></div>
      </Panel>
    </div>
  );
}
