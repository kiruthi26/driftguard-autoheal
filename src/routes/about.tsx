import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/arc/kit";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — DriftShield-Arc" },
      { name: "description", content: "Self-Healing Data Pipeline Framework: autonomous pipeline resilience, real-time anomaly remediation and dynamic drift reconstruction." },
      { property: "og:title", content: "About — DriftShield-Arc" },
      { property: "og:description", content: "Academic data science project on self-healing data pipelines." },
    ],
  }),
  component: AboutPage,
});

const ALGOS = [
  ["Schema Comparison", "Column-set and inferred-type diff between baseline and current data (new, removed, type, nullability)."],
  ["Population Stability Index", "Bins defined by baseline deciles; PSI = Σ (c−b)·ln(c/b). Categorical columns use category shares."],
  ["Kolmogorov-Smirnov test", "Two-sample D = max|F₁(x) − F₂(x)| with asymptotic Kolmogorov p-value."],
  ["Isolation Forest", "100 random isolation trees on ψ = 256 sub-samples; score s(x) = 2^(−E[h(x)]/c(ψ))."],
  ["Rule-Based Remediation", "Maps each diagnosed issue type to a safe action; uncertain cases are quarantined."],
  ["Quality Score", "100 minus weighted penalties for missing, duplicates, schema, invalid, drift and anomalies."],
];

function AboutPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Academic Data Science Programming Project" title="Self-Healing Data Pipeline Framework" subtitle="A Novel Algorithm for Autonomous Pipeline Resilience, Real-Time Anomaly Remediation, and Dynamic Data Drift Reconstruction" />
      <Panel title="Scope">
        <p className="text-sm leading-relaxed">The application update is <b>simulated</b>. DriftShield-Arc does not repair the software itself — it detects and automatically handles the <b>data-level</b> changes and quality problems the update causes, and only releases data downstream after re-validation passes.</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">BEFORE UPDATE → APPLICATION UPDATE → AFTER UPDATE → DETECT → DIAGNOSE → PROCESSING → REMEDIATE → VALIDATE → RESOLVED → RECOVER → RELEASE</p>
      </Panel>
      <Panel title="Algorithms implemented">
        <div className="grid gap-3 md:grid-cols-2">{ALGOS.map(([k, v]) => <div key={k} className="rounded-lg border p-3"><div className="font-semibold">{k}</div><p className="mt-1 text-sm text-muted-foreground">{v}</p></div>)}</div>
      </Panel>
      <Panel title="Metrics">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><b>MTTD</b> — mean time from run start (ingest) to issue detection.</li>
          <li><b>MTTR</b> — mean time from detection to validated resolution.</li>
          <li><b>Auto-resolution %</b> — resolved issues ÷ detected issues across all runs.</li>
        </ul>
      </Panel>
    </div>
  );
}
