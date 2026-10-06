import { createFileRoute } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useArc } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/engine/pipeline";
import { PageHeader, Panel } from "@/components/arc/kit";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DriftShield-Arc" },
      { name: "description", content: "Configure auto-remediation, PSI and KS thresholds, Isolation Forest cut-off and demo speed." },
      { property: "og:title", content: "Settings — DriftShield-Arc" },
      { property: "og:description", content: "Tune detection thresholds for the self-healing pipeline." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, setSettings } = useArc();
  const Row = ({ label, hint, value, min, max, step, k }: { label: string; hint: string; value: number; min: number; max: number; step: number; k: keyof typeof settings }) => (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex justify-between"><div><div className="font-medium">{label}</div><div className="text-xs text-muted-foreground">{hint}</div></div><span className="font-mono font-bold">{value}</span></div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => setSettings({ [k]: v })} />
    </div>
  );
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Configuration" title="Settings" subtitle="Changes apply to the next pipeline run." >
        <Button variant="outline" onClick={() => setSettings(DEFAULT_SETTINGS)}>Restore defaults</Button>
      </PageHeader>
      <Panel title="Remediation">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div><div className="font-medium">AUTO-REMEDIATION</div><div className="text-xs text-muted-foreground">When off, the pipeline stops after diagnosis and waits for review.</div></div>
          <div className="flex items-center gap-2"><span className="font-mono text-sm font-bold">{settings.autoRemediation ? "ON" : "OFF"}</span><Switch checked={settings.autoRemediation} onCheckedChange={(v) => setSettings({ autoRemediation: v })} /></div>
        </div>
      </Panel>
      <Panel title="Detection thresholds">
        <div className="grid gap-3 md:grid-cols-2">
          <Row label="PSI significant drift" hint="Flag drift when PSI exceeds" value={settings.psiThreshold} min={0.1} max={0.5} step={0.01} k="psiThreshold" />
          <Row label="KS significance α" hint="Reject same-distribution when p < α" value={settings.ksAlpha} min={0.001} max={0.1} step={0.001} k="ksAlpha" />
          <Row label="Isolation Forest threshold" hint="Anomaly when score ≥" value={settings.ifThreshold} min={0.6} max={0.85} step={0.01} k="ifThreshold" />
          <Row label="Missing-value tolerance" hint="Allowed increase vs baseline (ratio)" value={settings.missingTolerance} min={0.005} max={0.1} step={0.005} k="missingTolerance" />
          <Row label="Demo speed multiplier" hint="Higher = slower animation for presentations" value={settings.speed} min={0.25} max={3} step={0.25} k="speed" />
        </div>
      </Panel>
    </div>
  );
}
