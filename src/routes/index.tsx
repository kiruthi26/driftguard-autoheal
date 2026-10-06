import { createFileRoute } from "@tanstack/react-router";
import { useArc } from "@/lib/store";
import { ActionButtons, FlowTimeline, InlineLink, Panel, PipelineStages, ProgressBar, StatusBadge } from "@/components/arc/kit";
import { ComparisonPanel, DataPreview, DatasetExplorer, DatasetSummary, DistributionCharts, IssueCard, MetricsProof, QualityTrio, RemediationFlowCard, ValidationTable } from "@/components/arc/views";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DriftShield-Arc" },
      { name: "description", content: "Self-healing data pipeline dashboard: simulate an application update, detect drift, remediate and release clean data." },
      { property: "og:title", content: "DriftShield-Arc — Self-Healing Data Pipeline" },
      { property: "og:description", content: "Detect, diagnose, remediate and validate data drift after an application update." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useArc();
  const active = s.issues.find((i) => i.id === s.activeIssueId);
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-hero p-5 md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-sidebar-primary">MLOps · Data Engineering</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-on-dark md:text-4xl">DriftShield-Arc</h1>
            <p className="mt-1 text-on-dark-muted">Self-Healing Data Pipeline Framework</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-on-dark-muted">
              <span>Application Version <b className="text-on-dark">{s.version}</b></span>·
              <span>Dataset State <b className="text-on-dark">{s.phase === "baseline" ? "BASELINE" : s.phase === "resolved" ? "REMEDIATED" : "CURRENT"}</b></span>·
              <span>Auto-Remediation <b className="text-on-dark">{s.settings.autoRemediation ? "ON" : "OFF"}</b></span>
            </div>
          </div>
          <ActionButtons />
        </div>
      </section>

      <Panel title="Self-healing flow"><FlowTimeline /></Panel>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Pipeline stages"><PipelineStages /></Panel>
        <Panel title="Data quality score"><QualityTrio /></Panel>
      </div>

      {s.phase === "baseline" && (
        <>
          <DatasetSummary ds={s.baseline} a={s.baseAnalysis} label="BEFORE UPDATE — BASELINE DATA" subtitle="Previous / Normal Data" healthy />
          <Panel title="Data preview"><DataPreview ds={s.baseline} /></Panel>
          <DistributionCharts ds={s.baseline} a={s.baseAnalysis} />
        </>
      )}

      {s.phase === "updating" && (
        <Panel tone="info" title="Application update in progress" action={<StatusBadge status="PROCESSING" />}>
          <ul className="space-y-2">{s.updateSteps.map((u, i) => <li key={i} className="flex items-center justify-between rounded-md border p-2.5 text-sm"><span>STEP {i + 1} · {u.label}</span><StatusBadge status={u.status === "done" ? "RESOLVED" : u.status === "running" ? "PROCESSING" : "PENDING"} label={u.status === "done" ? "Completed" : undefined} /></li>)}</ul>
        </Panel>
      )}

      {s.currentAnalysis && s.phase !== "baseline" && s.phase !== "updating" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">BEFORE vs AFTER UPDATE</h2>
            <InlineLink to="/drift">Drift details</InlineLink>
          </div>
          <ComparisonPanel before={s.baseAnalysis} after={s.currentAnalysis} />
        </>
      )}

      {active && (
        <Panel tone="info" title="🔄 Remediation in progress" action={<span className="font-mono text-sm font-bold">{s.stageProgress}%</span>}>
          <ProgressBar value={s.stageProgress} active />
          <div className="mt-4"><RemediationFlowCard issue={active} /></div>
        </Panel>
      )}

      {s.issues.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">🚨 {s.issues.length} ISSUES DETECTED</h2>
            <InlineLink to="/remediation">Remediation Center</InlineLink>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">{s.issues.map((i, k) => <IssueCard key={i.id} issue={i} index={k} />)}</div>
        </div>
      )}

      {s.remediatedAnalysis && s.currentAnalysis && (
        <Panel tone={s.released ? "ok" : "bad"} title={s.released ? "AFTER REMEDIATION — RESOLVED" : "AFTER REMEDIATION — VALIDATION FAILED"} action={<StatusBadge status={s.released ? "RELEASED" : "BLOCKED"} label={s.released ? "Clean data released" : "Release blocked"} />}>
          <MetricsProof before={s.currentAnalysis} after={s.remediatedAnalysis} />
          <div className="mt-4"><ValidationTable checks={s.checks} /></div>
          {s.released && <p className="mt-3 rounded-lg bg-success-soft p-3 text-sm text-success">🟢 Validated data has been successfully released to downstream systems.</p>}
        </Panel>
      )}

      {s.phase !== "baseline" && <Panel title="Dataset explorer — Baseline · Current · Remediated"><DatasetExplorer /></Panel>}
    </div>
  );
}
