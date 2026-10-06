import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useArc } from "@/lib/store";
import { PageHeader, Panel, PipelineStages, ProgressBar, Stat } from "@/components/arc/kit";
import { LogsTable } from "@/components/arc/views";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline Run — DriftShield-Arc" },
      { name: "description", content: "Manually run the currently loaded dataset through Ingest → Profile → Detect → Diagnose → Remediate → Validate → Recover → Release." },
      { property: "og:title", content: "Pipeline Run — DriftShield-Arc" },
      { property: "og:description", content: "Manual self-healing pipeline execution with live stage status." },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const s = useArc();
  const ds = s.current ?? s.baseline;
  const done = Object.values(s.stages).filter((x) => x === "done").length;
  const runLogs = s.logs.filter((l) => l.runId === s.currentRunId);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Manual trigger" title="Pipeline Run" subtitle="Runs the currently loaded dataset through the self-healing pipeline. This does NOT simulate a new application version.">
        <Button variant="run" size="xl" disabled={s.running} onClick={() => { toast.info("Self-healing pipeline started"); s.runPipeline("MANUAL SELF-HEALING"); }}><Play /> RUN SELF-HEALING PIPELINE</Button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Loaded dataset" value={<span className="text-sm">{s.current ? "CURRENT" : "BASELINE"}</span>} hint={ds.name} />
        <Stat label="Rows" value={ds.rows.length.toLocaleString()} />
        <Stat label="Issues" value={s.issues.length} tone={s.issues.length ? "bad" : undefined} />
        <Stat label="Resolved" value={s.issues.filter((i) => i.status === "RESOLVED").length} tone="ok" />
      </div>
      <Panel title="Pipeline" action={<span className="font-mono text-sm">{Math.round((done / 8) * 100)}%</span>}>
        <ProgressBar value={(done / 8) * 100} active={s.running} />
        <div className="mt-4"><PipelineStages /></div>
      </Panel>
      <Panel title="Current run event stream"><LogsTable logs={runLogs} limit={60} /></Panel>
      <Panel title="UPDATE APPLICATION vs RUN SELF-HEALING PIPELINE">
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div className="rounded-lg border p-3"><b>🔄 Update Application</b><p className="mt-1 font-mono text-xs text-muted-foreground">v1.0 → Application Update → v2.0 → New Current Data → Detect Changes → Self-Healing</p></div>
          <div className="rounded-lg border p-3"><b>▶ Run Self-Healing Pipeline</b><p className="mt-1 font-mono text-xs text-muted-foreground">Existing Data → Ingest → Profile → Detect → Diagnose → Remediate → Validate → Recover → Release</p></div>
        </div>
      </Panel>
    </div>
  );
}
