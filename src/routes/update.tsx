import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useArc } from "@/lib/store";
import { SCENARIOS } from "@/lib/engine/data";
import { EmptyState, FlowTimeline, InlineLink, PageHeader, Panel, PipelineStages, StatusBadge } from "@/components/arc/kit";
import { ComparisonPanel, IssueCard } from "@/components/arc/views";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/update")({
  head: () => ({
    meta: [
      { title: "Application Update — DriftShield-Arc" },
      { name: "description", content: "Simulate an application/data-source version update and watch the post-update data analysis." },
      { property: "og:title", content: "Application Update — DriftShield-Arc" },
      { property: "og:description", content: "Simulate v1.0 → v2.0 and see the data-level impact." },
    ],
  }),
  component: UpdatePage,
});

const IMPACT = ["Schema", "Data Types", "Missing Values", "Distribution", "Anomalies", "Duplicates"];

function UpdatePage() {
  const s = useArc();
  const sc = SCENARIOS.find((x) => x.id === s.scenario)!;
  const next = `v${parseInt(s.version.replace("v", "")) + 1}.0`;
  const showFrom = s.phase === "updating" || !s.previousVersion ? s.version : s.previousVersion;
  const showTo = s.phase === "updating" || !s.previousVersion ? next : s.version;
  const done = s.updateSteps.every((u) => u.status === "done");
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Main trigger" title="Application Update" subtitle="Simulates an application / data-source release. DriftShield-Arc does not repair the application — it handles the data-level changes the update causes.">
        <Button variant="outline" onClick={s.reset} disabled={s.running}><RotateCcw /> Reset to baseline</Button>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="Version change">
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="rounded-xl border bg-muted px-5 py-4 text-center"><div className="text-[11px] uppercase text-muted-foreground">Current Version</div><div className="font-mono text-3xl font-bold">{showFrom}</div></div>
            <ArrowRight className={cn("h-6 w-6 text-primary", s.phase === "updating" && "animate-pulse")} />
            <div className="rounded-xl border border-primary bg-accent px-5 py-4 text-center"><div className="text-[11px] uppercase text-muted-foreground">New Version</div><div className="font-mono text-3xl font-bold text-primary">{showTo}</div></div>
          </div>
          <div className="text-center text-xs text-muted-foreground">Scenario: <b>{s.uploadedCurrent ? `Uploaded file (${s.uploadedCurrent.name})` : sc.label}</b> — change on the Data Upload page</div>
          <Button variant="hero" size="xl" className="mt-5 w-full" disabled={s.running} onClick={s.updateApplication}>
            <RefreshCw className={cn(s.running && "animate-spin")} /> Simulate Application Update
          </Button>
        </Panel>

        <Panel title="Update impact preview">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {IMPACT.map((k) => {
              const hit = s.uploadedCurrent ? null : sc.effects.includes(k);
              return (
                <div key={k} className={cn("rounded-lg border p-3", hit ? "border-destructive/30 bg-danger-soft" : "bg-card")}>
                  <div className="text-sm font-semibold">{k}</div>
                  <div className={cn("mt-1 font-mono text-[11px]", hit ? "text-destructive" : "text-muted-foreground")}>{hit === null ? "Unknown — will be measured" : hit ? "Expected impact" : "No change expected"}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{sc.description}</p>
        </Panel>
      </div>

      {(s.phase === "updating" || s.previousVersion) && (
        <Panel title="Update progress" tone={done ? "ok" : "info"}>
          <ol className="space-y-2">
            {s.updateSteps.map((u, i) => (
              <li key={i} className={cn("flex items-center justify-between gap-2 rounded-lg border p-3", u.status === "running" && "pulse-ring border-primary")}>
                <span className="text-sm"><span className="mr-2 font-mono text-xs text-muted-foreground">STEP {i + 1}</span>{u.label}</span>
                <StatusBadge status={u.status === "done" ? "RESOLVED" : u.status === "running" ? "PROCESSING" : "PENDING"} label={u.status === "done" ? "Completed" : undefined} />
              </li>
            ))}
          </ol>
          {done && <div className="mt-3 text-center font-mono text-lg font-bold text-success">{showFrom} → {showTo} ✓</div>}
        </Panel>
      )}

      {s.previousVersion && s.currentAnalysis && s.phase !== "updating" ? (
        <>
          <h2 className="pt-2 text-xl font-semibold">POST-UPDATE DATA ANALYSIS</h2>
          <Panel title="Timeline"><FlowTimeline /></Panel>
          <Panel title="Live pipeline"><PipelineStages /></Panel>
          <ComparisonPanel before={s.baseAnalysis} after={s.currentAnalysis} />
          {s.issues.length > 0 && (
            <>
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">🚨 {s.issues.length} ISSUES DETECTED</h3><InlineLink to="/remediation">Open Remediation Center</InlineLink></div>
              <div className="grid gap-3 lg:grid-cols-2">{s.issues.map((i, k) => <IssueCard key={i.id} issue={i} index={k} />)}</div>
            </>
          )}
        </>
      ) : s.phase === "baseline" && <EmptyState title="BEFORE UPDATE — system healthy" body={`Application ${s.version} is running on baseline data. Click "Simulate Application Update" to release a new version.`} />}
    </div>
  );
}
