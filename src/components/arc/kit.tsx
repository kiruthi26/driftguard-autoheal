import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Clock, X, Minus, RefreshCw, Play, ArrowRight, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FLOW, STAGES, flowIndex, useArc, type StageStatus } from "@/lib/store";
import type { IssueStatus, Severity } from "@/lib/engine/pipeline";

export function PageHeader({ title, subtitle, eyebrow, children }: { title: string; subtitle?: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, tone }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tone?: "ok" | "bad" | "info" }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-card md:p-5", tone === "ok" && "border-success/40", tone === "bad" && "border-destructive/40", tone === "info" && "border-primary/40", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "ok" | "bad" | "warn" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-xl font-semibold", tone === "ok" && "text-success", tone === "bad" && "text-destructive", tone === "warn" && "text-warning")}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  DETECTED: "bg-danger-soft text-destructive border-destructive/30",
  PENDING: "bg-muted text-muted-foreground border-border",
  PROCESSING: "bg-info-soft text-info border-info/30",
  VALIDATING: "bg-warning-soft text-warning border-warning/40",
  RESOLVED: "bg-success-soft text-success border-success/30",
  FAILED: "bg-danger-soft text-destructive border-destructive/30",
  REQUIRES_REVIEW: "bg-warning-soft text-warning border-warning/40",
  QUARANTINED: "bg-muted text-foreground border-foreground/20",
  HEALTHY: "bg-success-soft text-success border-success/30",
  ISSUES: "bg-danger-soft text-destructive border-destructive/30",
  RELEASED: "bg-success-soft text-success border-success/30",
  PASSED: "bg-success-soft text-success border-success/30",
  BLOCKED: "bg-danger-soft text-destructive border-destructive/30",
};
const STATUS_ICON: Record<string, string> = { DETECTED: "🚨", PENDING: "⏳", PROCESSING: "🔄", VALIDATING: "🧪", RESOLVED: "✅", FAILED: "❌", REQUIRES_REVIEW: "⚠️", QUARANTINED: "🔒", HEALTHY: "🟢", ISSUES: "🔴", RELEASED: "🟢", PASSED: "🟢", BLOCKED: "🔴" };

export function StatusBadge({ status, label, className }: { status: IssueStatus | "HEALTHY" | "ISSUES" | "RELEASED" | "PASSED" | "BLOCKED"; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide", STATUS_STYLE[status], className)}>
      <span className={cn(status === "PROCESSING" && "animate-spin")}>{STATUS_ICON[status]}</span>
      {label ?? status.replace("_", " ")}
    </span>
  );
}

export function SeverityBadge({ s }: { s: Severity }) {
  return <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-bold", s === "HIGH" ? "bg-destructive text-destructive-foreground" : s === "MEDIUM" ? "bg-warning text-secondary" : "bg-muted text-muted-foreground")}>{s}</span>;
}

function StageIcon({ s }: { s: StageStatus }) {
  if (s === "done") return <Check className="h-4 w-4" />;
  if (s === "running") return <Loader2 className="h-4 w-4 animate-spin" />;
  if (s === "failed") return <X className="h-4 w-4" />;
  if (s === "skipped") return <Minus className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

export function PipelineStages({ compact }: { compact?: boolean }) {
  const stages = useArc((s) => s.stages);
  const phase = useArc((s) => s.phase);
  const released = useArc((s) => s.released);
  return (
    <div>
      <div className={cn("grid gap-2", compact ? "grid-cols-4 md:grid-cols-8" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8")}>
        {STAGES.map((st, i) => {
          const s = stages[st];
          return (
            <div key={st} className={cn("relative flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all",
              s === "done" && "border-success/40 bg-success-soft text-success",
              s === "running" && "pulse-ring border-primary bg-accent text-primary",
              s === "failed" && "border-destructive/40 bg-danger-soft text-destructive",
              s === "skipped" && "bg-muted text-muted-foreground",
              s === "pending" && "bg-card text-muted-foreground")}>
              <span className="font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate font-mono text-[11px] font-semibold md:text-xs">{st}</span>
              <span className="ml-auto"><StageIcon s={s} /></span>
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Overall:</span>
          {phase === "resolved" && released ? <StatusBadge status="RELEASED" label="Pipeline Recovered" /> :
            phase === "failed" ? <StatusBadge status="FAILED" label="Recovery failed" /> :
            phase === "awaiting" ? <StatusBadge status="REQUIRES_REVIEW" label="Awaiting manual remediation" /> :
            phase === "baseline" ? <StatusBadge status="HEALTHY" label="Idle · Healthy" /> :
            <StatusBadge status="PROCESSING" label="Running" />}
        </div>
      )}
    </div>
  );
}

export function FlowTimeline() {
  const st = useArc();
  const idx = flowIndex(st);
  const failed = st.phase === "failed";
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center gap-1 px-1">
        {FLOW.map((f, i) => {
          const done = i < idx;
          const active = i === idx && st.phase !== "baseline" && !(st.phase === "resolved");
          return (
            <li key={f} className="flex items-center gap-1">
              <span className={cn("rounded-md border px-2 py-1 font-mono text-[10px] font-semibold tracking-wide md:text-[11px]",
                done && "border-success/40 bg-success-soft text-success",
                active && !failed && "pulse-ring border-primary bg-primary text-primary-foreground",
                active && failed && "border-destructive bg-destructive text-destructive-foreground",
                !done && !active && "bg-card text-muted-foreground",
                i === 0 && st.phase === "baseline" && "border-success/40 bg-success-soft text-success")}>
                {done && "✓ "}{f}
              </span>
              {i < FLOW.length - 1 && <ArrowRight className={cn("h-3 w-3", done ? "text-success" : "text-muted-foreground/50")} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ActionButtons({ size = "xl" as "xl" | "lg" }) {
  const running = useArc((s) => s.running);
  const run = useArc((s) => s.runPipeline);
  const nav = useNavigate();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="hero" size={size} disabled={running} onClick={() => nav({ to: "/update" })}>
        <RefreshCw className={cn(running && "animate-spin")} /> UPDATE APPLICATION
      </Button>
      <Button variant="run" size={size} disabled={running} onClick={() => { toast.info("Manual self-healing run started", { description: "Running the currently loaded dataset through the pipeline." }); run("MANUAL SELF-HEALING"); }}>
        <Play /> RUN SELF-HEALING PIPELINE
      </Button>
    </div>
  );
}

export function ProgressBar({ value, active, tone }: { value: number; active?: boolean; tone?: "ok" | "bad" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all duration-300", tone === "ok" ? "bg-success" : tone === "bad" ? "bg-destructive" : "bg-gradient-primary", active && "stripes")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card p-8 text-center">
      <ShieldAlert className="h-8 w-8 text-muted-foreground" />
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {cta && <div className="mt-4"><ActionButtons size="lg" /></div>}
    </div>
  );
}

export function InlineLink({ to, children }: { to: "/remediation" | "/validation" | "/drift" | "/history" | "/update" | "/pipeline" | "/anomaly"; children: ReactNode }) {
  return <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{children} <ArrowRight className="h-3.5 w-3.5" /></Link>;
}

export const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`);
export const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
