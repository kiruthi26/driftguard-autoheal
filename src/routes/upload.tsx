import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Upload, Database, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useArc } from "@/lib/store";
import { SCENARIOS, makeBaseline, parseCSV } from "@/lib/engine/data";
import { PageHeader, Panel } from "@/components/arc/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Data Upload — DriftShield-Arc" },
      { name: "description", content: "Upload baseline and current CSV files or pick a synthetic sample scenario." },
      { property: "og:title", content: "Data Upload — DriftShield-Arc" },
      { property: "og:description", content: "Seven built-in scenarios from normal data to a combined update." },
    ],
  }),
  component: UploadPage,
});

function FileDrop({ label, onFile, current }: { label: string; onFile: (f: File) => void; current?: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-6 text-center transition-colors hover:border-primary hover:bg-accent">
      <Upload className="h-6 w-6 text-primary" />
      <div className="mt-2 font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{current ?? "CSV with header row"}</div>
      <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </label>
  );
}

function UploadPage() {
  const s = useArc();
  const nav = useNavigate();
  const read = async (f: File, kind: "baseline" | "current") => {
    try {
      const ds = parseCSV(await f.text(), f.name);
      if (!ds.rows.length) throw new Error("No rows found");
      if (kind === "baseline") { s.setBaseline(ds); toast.success(`Baseline loaded: ${ds.rows.length} rows`); }
      else { s.setUploadedCurrent(ds); toast.success(`Current data loaded: ${ds.rows.length} rows`, { description: "It will be used as incoming data on the next update." }); }
    } catch (e) { toast.error("Could not read CSV", { description: (e as Error).message }); }
  };
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Inputs" title="Data Upload" subtitle="Bring your own CSVs or use a synthetic employee dataset (ID, Name, Age, Salary, Department, Location)." />
      <div className="grid gap-4 md:grid-cols-2">
        <FileDrop label="Upload Baseline CSV" current={s.baseline.name} onFile={(f) => read(f, "baseline")} />
        <FileDrop label="Upload Current CSV" current={s.uploadedCurrent?.name} onFile={(f) => read(f, "current")} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { s.setBaseline(makeBaseline()); s.setUploadedCurrent(null); toast.success("Sample dataset restored"); }}><Database /> Use Sample Dataset</Button>
        {s.uploadedCurrent && <Button variant="ghost" onClick={() => s.setUploadedCurrent(null)}>Remove uploaded current file</Button>}
      </div>
      <Panel title="Sample scenarios (incoming data after update)">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SCENARIOS.map((sc, i) => {
            const on = s.scenario === sc.id && !s.uploadedCurrent;
            return (
              <button key={sc.id} onClick={() => { s.setScenario(sc.id); s.setUploadedCurrent(null); toast.success(`Scenario: ${sc.label}`); }} className={cn("rounded-xl border p-4 text-left transition-all", on ? "border-primary bg-accent shadow-glow" : "bg-card hover:bg-muted")}>
                <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{i + 1}</span>{on && <Check className="h-4 w-4 text-primary" />}</div>
                <div className="mt-1 font-semibold">{sc.label}</div>
                <p className="mt-1 text-xs text-muted-foreground">{sc.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">{sc.effects.map((e) => <span key={e} className="rounded bg-danger-soft px-1.5 py-0.5 font-mono text-[10px] text-destructive">{e}</span>)}</div>
              </button>
            );
          })}
        </div>
        <Button variant="hero" className="mt-4" onClick={() => nav({ to: "/update" })}>Continue to Application Update →</Button>
      </Panel>
    </div>
  );
}
