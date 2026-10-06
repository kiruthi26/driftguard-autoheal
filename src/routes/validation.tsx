import { createFileRoute } from "@tanstack/react-router";
import { useArc } from "@/lib/store";
import { EmptyState, PageHeader, Panel, PipelineStages, StatusBadge } from "@/components/arc/kit";
import { ComparisonPanel, ValidationTable } from "@/components/arc/views";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Validation — DriftShield-Arc" },
      { name: "description", content: "Re-validation of remediated data: schema, missing values, duplicates, invalid records, drift, anomalies and quality." },
      { property: "og:title", content: "Validation — DriftShield-Arc" },
      { property: "og:description", content: "Before vs after remediation checks gate the downstream release." },
    ],
  }),
  component: ValidationPage,
});

function ValidationPage() {
  const s = useArc();
  const passed = s.checks.length > 0 && s.checks.every((c) => c.passed);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Gate" title="Validation" subtitle="Clean data is released downstream only when every required validation passes." />
      {!s.checks.length ? <EmptyState title="No validation yet" body="Validation runs automatically after remediation." cta /> : (
        <>
          <Panel tone={passed ? "ok" : "bad"} title="Re-validation: before vs after remediation" action={<StatusBadge status={passed ? "PASSED" : "FAILED"} label={passed ? "All checks passed" : "Checks failed"} />}>
            <ValidationTable checks={s.checks} />
          </Panel>
          <Panel title="Pipeline recovery"><PipelineStages /></Panel>
          <Panel tone={s.released ? "ok" : "bad"} title="Downstream release">
            {s.released ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-lg font-semibold">Clean Data Ready</div><p className="text-sm text-muted-foreground">Validated data has been successfully released to downstream systems. ({s.remediated?.rows.length.toLocaleString()} rows{s.quarantinedCols.length ? `, quarantined columns: ${s.quarantinedCols.join(", ")}` : ""})</p></div><StatusBadge status="RELEASED" /></div>
            ) : <div className="flex items-center justify-between"><p className="text-sm">Release blocked — data is not released when validation fails.</p><StatusBadge status="BLOCKED" /></div>}
          </Panel>
          {s.currentAnalysis && s.remediatedAnalysis && <ComparisonPanel before={s.currentAnalysis} after={s.remediatedAnalysis} labels={["BEFORE REMEDIATION", "AFTER REMEDIATION"]} />}
        </>
      )}
    </div>
  );
}
