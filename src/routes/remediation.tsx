import { createFileRoute } from "@tanstack/react-router";
import { useArc } from "@/lib/store";
import { EmptyState, PageHeader, Panel, PipelineStages, ProgressBar, StatusBadge } from "@/components/arc/kit";
import { MetricsProof, RemediationFlowCard } from "@/components/arc/views";

export const Route = createFileRoute("/remediation")({
  head: () => ({
    meta: [
      { title: "Remediation Center — DriftShield-Arc" },
      { name: "description", content: "Rule-based remediation engine with issue-by-issue processing, validation and resolution." },
      { property: "og:title", content: "Remediation Center — DriftShield-Arc" },
      { property: "og:description", content: "Watch each data issue go DETECTED → PROCESSING → VALIDATING → RESOLVED." },
    ],
  }),
  component: RemediationPage,
});

const RULES = [
  ["Missing numerical values", "Median Imputation"],
  ["Missing categorical values", "Mode Imputation"],
  ["Schema / type mismatch", "Safe Auto-Casting"],
  ["Duplicate records", "Duplicate Resolution"],
  ["Outliers", "Configured Outlier Handling (IQR capping)"],
  ["Invalid records", "Correct if safely possible"],
  ["Numeric distribution drift", "Distribution Alignment / Review"],
  ["Unsafe / uncertain problems", "Requires Review / Quarantine"],
];

function RemediationPage() {
  const s = useArc();
  const active = s.issues.find((i) => i.id === s.activeIssueId);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={`Auto-remediation: ${s.settings.autoRemediation ? "ON" : "OFF"}`} title="Remediation Center" subtitle="Each issue is diagnosed, processed, re-validated, and only then marked RESOLVED." />
      {!s.issues.length ? <EmptyState title="No issues to remediate" body="Trigger an application update or run the pipeline on data with issues." cta /> : (
        <>
          <Panel tone={active ? "info" : s.phase === "resolved" ? "ok" : undefined} title={active ? "🔄 Remediation in Progress" : s.phase === "resolved" ? "✅ Remediation complete" : "Remediation"} action={<span className="font-mono text-lg font-bold">{s.stageProgress}%</span>}>
            <ProgressBar value={s.stageProgress} active={!!active} tone={s.phase === "resolved" ? "ok" : undefined} />
            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
            {active && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-xs md:grid-cols-5">
                <div><div className="text-muted-foreground">Issue</div><b>{active.title}</b></div>
                <div><div className="text-muted-foreground">Detected by</div><b>{active.detectedBy}</b></div>
                <div><div className="text-muted-foreground">Action</div><b className="text-primary">{active.action}</b></div>
                <div><div className="text-muted-foreground">Records</div><b className="font-mono">{active.affected.toLocaleString()}</b></div>
                <div><div className="text-muted-foreground">Status</div><StatusBadge status={active.status} /></div>
              </div>
            )}
            <div className="mt-4"><PipelineStages compact /></div>
          </Panel>

          <Panel title="Issue-by-issue processing">
            <div className="space-y-2">
              {s.issues.map((i) => (
                <div key={i.id} className="grid grid-cols-2 items-center gap-2 rounded-lg border p-3 text-sm md:grid-cols-[2fr_2fr_1fr_1fr]">
                  <b>{i.title}</b>
                  <span className="text-primary">{i.action}</span>
                  <span className="font-mono text-xs">{i.affected.toLocaleString()} records</span>
                  <span className="justify-self-end"><StatusBadge status={i.status} /></span>
                </div>
              ))}
            </div>
          </Panel>

          <div>
            <h2 className="mb-3 text-lg font-semibold">BEFORE → PROCESSING → AFTER → VALIDATION → RESOLVED</h2>
            <div className="space-y-3">{s.issues.map((i) => <RemediationFlowCard key={i.id} issue={i} />)}</div>
          </div>

          {s.currentAnalysis && s.remediatedAnalysis && <Panel tone="ok" title="Proof of automatic remediation (computed)"><MetricsProof before={s.currentAnalysis} after={s.remediatedAnalysis} /></Panel>}
        </>
      )}
      <Panel title="Rule-based remediation engine">
        <div className="grid gap-2 md:grid-cols-2">{RULES.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"><span>{k}</span><span className="font-mono text-xs font-semibold text-primary">→ {v}</span></div>)}</div>
      </Panel>
    </div>
  );
}
