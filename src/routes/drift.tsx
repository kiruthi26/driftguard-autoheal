import { createFileRoute } from "@tanstack/react-router";
import { useArc } from "@/lib/store";
import { EmptyState, PageHeader, Panel, SeverityBadge } from "@/components/arc/kit";
import { ProfileTable, PsiBins } from "@/components/arc/views";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/drift")({
  head: () => ({
    meta: [
      { title: "Drift Detection — DriftShield-Arc" },
      { name: "description", content: "Schema drift, Population Stability Index and Kolmogorov-Smirnov tests between baseline and current data." },
      { property: "og:title", content: "Drift Detection — DriftShield-Arc" },
      { property: "og:description", content: "PSI, KS test and schema comparison computed from live data." },
    ],
  }),
  component: DriftPage,
});

function DriftPage() {
  const { baseAnalysis, currentAnalysis: a, remediatedAnalysis: r, settings } = useArc();
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Algorithms" title="Drift Detection" subtitle="Schema comparison, PSI and the two-sample KS test, all computed from the loaded datasets." />
      {!a ? <EmptyState title="No current data yet" body="Run an application update to compare incoming data against the baseline." cta /> : (
        <>
          <Panel title="Schema drift" tone={a.schema.some((c) => c.severity === "HIGH") ? "bad" : undefined} action={a.schema.some((c) => c.change === "TYPE") && <span className="font-mono text-xs font-bold text-destructive">🚨 SCHEMA MISMATCH DETECTED</span>}>
            {a.schema.length === 0 ? <p className="text-sm text-success">🟢 Schema matches baseline.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                <thead className="font-mono text-[11px] uppercase text-muted-foreground"><tr><th className="py-2">Column</th><th>Change</th><th>Before</th><th>After</th><th>Method</th><th>Severity</th></tr></thead>
                <tbody>{a.schema.map((c) => <tr key={c.column + c.change} className="border-t"><td className="py-2 font-semibold">{c.column}</td><td className="font-mono text-xs">{c.change}</td><td className="font-mono">{c.before}</td><td className="font-mono text-destructive">{c.after}</td><td className="text-xs">Schema Comparison</td><td><SeverityBadge s={c.severity} /></td></tr>)}</tbody>
              </table></div>
            )}
          </Panel>

          <Panel title="A · Population Stability Index (PSI)">
            <p className="mb-3 text-xs text-muted-foreground">PSI = Σ (cᵢ − bᵢ) · ln(cᵢ / bᵢ) over baseline-decile bins. &lt; 0.10 stable · 0.10–0.25 moderate · &gt; {settings.psiThreshold} significant.</p>
            <div className="grid gap-4 lg:grid-cols-2">
              {a.psi.map((p) => {
                const after = r?.psi.find((x) => x.column === p.column);
                return (
                  <div key={p.column} className="rounded-lg border p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <b>{p.column}</b>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span>PSI <b>{p.psi.toFixed(3)}</b></span>
                        <span className={cn("rounded px-1.5 py-0.5 font-bold", p.severity === "Stable" ? "bg-success-soft text-success" : p.severity === "Moderate Drift" ? "bg-warning-soft text-warning" : "bg-danger-soft text-destructive")}>{p.severity}</span>
                        {after && <span className="text-success">→ {after.psi.toFixed(3)} after fix</span>}
                      </div>
                    </div>
                    <PsiBins bins={p.bins} />
                    <div className="text-xs text-muted-foreground">Decision: {p.psi > settings.psiThreshold ? "Flag as drift → remediation" : "Accept"}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="B · Kolmogorov-Smirnov two-sample test">
            <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <thead className="font-mono text-[11px] uppercase text-muted-foreground"><tr><th className="py-2">Column</th><th>KS statistic (D)</th><th>p-value</th><th>Threshold α</th><th>Decision</th><th>Severity</th><th>After remediation</th></tr></thead>
              <tbody className="font-mono">{a.ks.map((k) => { const after = r?.ks.find((x) => x.column === k.column); return (
                <tr key={k.column} className="border-t"><td className="py-2 font-sans font-semibold">{k.column}</td><td>{k.statistic.toFixed(4)}</td><td>{k.pValue < 1e-4 ? k.pValue.toExponential(2) : k.pValue.toFixed(4)}</td><td>{k.alpha}</td><td className={k.drift ? "text-destructive font-bold" : "text-success"}>{k.drift ? "Reject H₀ — drift" : "Same distribution"}</td><td><SeverityBadge s={k.statistic > 0.3 ? "HIGH" : k.drift ? "MEDIUM" : "LOW"} /></td><td>{after ? `D=${after.statistic.toFixed(3)}` : "—"}</td></tr>); })}</tbody>
            </table></div>
            <p className="mt-2 text-xs text-muted-foreground">Note: with ~2,000 rows the KS test is very sensitive; PSI is used as the primary severity signal.</p>
          </Panel>

          <Panel title="Data profiling — Baseline vs Current"><ProfileTable base={baseAnalysis} cur={a} /></Panel>
        </>
      )}
    </div>
  );
}
