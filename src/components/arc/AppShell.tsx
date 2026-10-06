import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Upload, RefreshCw, Workflow, Activity, ScanSearch, Wrench, ShieldCheck, LineChart, History, Settings, Info, Menu, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useArc } from "@/lib/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Data Upload", icon: Upload },
  { to: "/update", label: "Application Update", icon: RefreshCw },
  { to: "/pipeline", label: "Pipeline Run", icon: Workflow },
  { to: "/drift", label: "Drift Detection", icon: Activity },
  { to: "/anomaly", label: "Anomaly Detection", icon: ScanSearch },
  { to: "/remediation", label: "Remediation Center", icon: Wrench },
  { to: "/validation", label: "Validation", icon: ShieldCheck },
  { to: "/monitoring", label: "Monitoring", icon: LineChart },
  { to: "/history", label: "Run History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About Project", icon: Info },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow"><Shield className="h-5 w-5 text-primary-foreground" /></div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight text-on-dark">DriftShield-Arc</div>
        <div className="text-[10px] text-sidebar-muted">Self-Healing Data Pipeline</div>
      </div>
    </div>
  );
}

function NavList({ onNav }: { onNav?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mt-6 space-y-0.5">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} onClick={onNav} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
            <n.icon className="h-4 w-4" />{n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PhasePill() {
  const phase = useArc((s) => s.phase);
  const map: Record<string, [string, string]> = {
    baseline: ["🟢 HEALTHY", "text-success"], updating: ["🔄 UPDATING", "text-info"], running: ["🔄 PIPELINE RUNNING", "text-info"],
    detected: ["🔴 ISSUES DETECTED", "text-destructive"], remediating: ["🔄 REMEDIATING", "text-info"], resolved: ["🟢 RECOVERED", "text-success"],
    failed: ["🔴 RECOVERY FAILED", "text-destructive"], awaiting: ["⚠️ AWAITING REVIEW", "text-warning"],
  };
  const [t, c] = map[phase];
  return <span className={cn("font-mono text-[11px] font-semibold", c)}>{t}</span>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const version = useArc((s) => s.version);
  useEffect(() => { useArc.persist.rehydrate(); }, []);
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar p-4 lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto rounded-lg border border-sidebar-border p-3 text-[11px] text-sidebar-muted">
          Academic Data Science Project<br />Detect · Diagnose · Remediate · Validate
        </div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-secondary/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar p-4">
            <div className="flex items-center justify-between"><Brand /><button onClick={() => setOpen(false)} className="text-sidebar-foreground"><X className="h-5 w-5" /></button></div>
            <NavList onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden text-sm font-semibold sm:block lg:hidden">DriftShield-Arc</div>
          <PhasePill />
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="hidden text-muted-foreground sm:inline">Application Version:</span>
            <span className="rounded-md bg-secondary px-2 py-1 font-mono font-bold text-secondary-foreground">{version}</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
