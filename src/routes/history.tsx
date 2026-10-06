import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useArc } from "@/lib/store";
import { PageHeader, Panel, Stat, fmtMs } from "@/components/arc/kit";
import { LogsTable, RunsTable } from "@/components/arc/views";
import { useMetrics } from "./monitoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Run History & Event Logs — DriftShield-Arc" },
      { name: "description", content: "Every pipeline run with trigger, version, issues, validation, MTTD and MTTR, plus full event logs." },
      { property: "og:title", content: "Run History & Event Logs — DriftShield-Arc" },
      { property: "og:description", content: "Detection, remediation, validation and recovery logs." },
    ],
  }),
  component: HistoryPage,
});

const FILTERS = ["ALL", "DETECTION", "REMEDIATION", "VALIDATION", "RECOVERY"] as const;

function HistoryPage() {
  const m = useMetrics();
  const clear = useArc((s) => s.clearHistory);
  const [f, setF] = useState<(typeof FILTERS)[number]>("ALL");
  const logs = m.logs.filter((l) => f === "ALL" ? true : f === "DETECTION" ? /DETECT|DRIFT|QUALITY/.test(l.event) : f === "RECOVERY" ? /RECOVERY|RELEASE|QUARANTINE/.test(l.event) : l.event === f);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Audit trail" title="Run History & Logs" subtitle="Stored in this browser. Timestamps are generated live during execution.">
        <Button variant="outline" onClick={clear}><Trash2 /> Clear history</Button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Total runs" value={m.runs.length} />
        <Stat label="MTTD" value={fmtMs(m.mttd)} hint="Mean Time To Detect" />
        <Stat label="MTTR" value={fmtMs(m.mttr)} hint="Mean Time To Recover" />
        <Stat label="Auto-resolution" value={`${m.auto.toFixed(0)}%`} hint={`${m.resolved}/${m.detected} issues`} tone="ok" />
      </div>
      <Panel title="Run history"><RunsTable runs={m.runs} /></Panel>
      <Panel title="Event logs" action={<div className="flex flex-wrap gap-1">{FILTERS.map((x) => <button key={x} onClick={() => setF(x)} className={cn("rounded-md border px-2 py-1 font-mono text-[10px] font-semibold", f === x ? "border-primary bg-accent text-primary" : "text-muted-foreground")}>{x}</button>)}</div>}>
        <LogsTable logs={logs} />
      </Panel>
    </div>
  );
}
