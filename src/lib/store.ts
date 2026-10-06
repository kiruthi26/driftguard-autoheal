import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { makeBaseline, makeCurrent, type Dataset, type ScenarioId } from "./engine/data";
import {
  analyze, detectIssues, remediate, validateIssue, validationChecks, DEFAULT_SETTINGS,
  type Analysis, type Issue, type Settings, type ValidationCheck,
} from "./engine/pipeline";

export const STAGES = ["INGEST", "PROFILE", "DETECT", "DIAGNOSE", "REMEDIATE", "VALIDATE", "RECOVER", "RELEASE"] as const;
export type Stage = (typeof STAGES)[number];
export type StageStatus = "pending" | "running" | "done" | "failed" | "skipped";
export type Phase = "baseline" | "updating" | "running" | "detected" | "remediating" | "resolved" | "failed" | "awaiting";
export type Trigger = "APPLICATION UPDATE" | "MANUAL SELF-HEALING";

export interface LogEvent {
  id: string; runId: string; ts: number; event: string; component: string; issue: string;
  method: string; action: string; records: number; status: string; durationMs: number;
}
export interface Run {
  id: string; start: number; end: number; trigger: Trigger; version: string; detected: number; resolved: number;
  quarantined: number; validation: "PASSED" | "FAILED" | "SKIPPED"; recovery: "RECOVERED" | "NOT RECOVERED" | "AWAITING";
  mttd: number; mttr: number; qualityBefore: number; qualityAfter: number; anomaliesBefore: number; anomaliesAfter: number; status: string;
}
export interface UpdateStep { label: string; status: "pending" | "running" | "done" }

const UPDATE_STEPS = ["Preparing update...", "Updating application/data source...", "Generating new incoming data...", "Update completed."];
const freshStages = () => Object.fromEntries(STAGES.map((s) => [s, "pending"])) as Record<Stage, StageStatus>;
const freshSteps = (): UpdateStep[] => UPDATE_STEPS.map((label) => ({ label, status: "pending" }));

interface State {
  version: string;
  previousVersion: string | null;
  scenario: ScenarioId;
  baseline: Dataset;
  baseAnalysis: Analysis;
  current: Dataset | null;
  currentAnalysis: Analysis | null;
  remediated: Dataset | null;
  remediatedAnalysis: Analysis | null;
  phase: Phase;
  running: boolean;
  stages: Record<Stage, StageStatus>;
  stageProgress: number;
  updateSteps: UpdateStep[];
  updateOpen: boolean;
  issues: Issue[];
  activeIssueId: string | null;
  checks: ValidationCheck[];
  released: boolean;
  quarantinedCols: string[];
  currentRunId: string | null;
  logs: LogEvent[];
  runs: Run[];
  settings: Settings;
  uploadedCurrent: Dataset | null;

  setScenario: (s: ScenarioId) => void;
  setBaseline: (d: Dataset) => void;
  setUploadedCurrent: (d: Dataset | null) => void;
  setSettings: (p: Partial<Settings>) => void;
  updateApplication: () => Promise<void>;
  runPipeline: (trigger?: Trigger) => Promise<void>;
  reset: () => void;
  clearHistory: () => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const initialBaseline = makeBaseline();
const initialBaseAnalysis = analyze(initialBaseline, initialBaseline, DEFAULT_SETTINGS);
const uid = () => Math.random().toString(36).slice(2, 9);
const nextVersion = (v: string) => `v${parseInt(v.replace("v", "")) + 1}.0`;

export const useArc = create<State>()(
  persist(
    (set, get) => {
      const d = (ms: number) => sleep(ms * get().settings.speed);
      const log = (e: Omit<LogEvent, "id" | "ts" | "runId"> & { ts?: number }) =>
        set((s) => ({ logs: [{ id: uid(), runId: s.currentRunId ?? "-", ts: e.ts ?? Date.now(), ...e }, ...s.logs].slice(0, 600) }));
      const setStage = (st: Stage, v: StageStatus) => set((s) => ({ stages: { ...s.stages, [st]: v } }));
      const patchIssue = (id: string, p: Partial<Issue>) => set((s) => ({ issues: s.issues.map((i) => (i.id === id ? { ...i, ...p } : i)) }));

      return {
        version: "v1.0",
        previousVersion: null,
        scenario: "combined",
        baseline: initialBaseline,
        baseAnalysis: initialBaseAnalysis,
        current: null,
        currentAnalysis: null,
        remediated: null,
        remediatedAnalysis: null,
        phase: "baseline",
        running: false,
        stages: freshStages(),
        stageProgress: 0,
        updateSteps: freshSteps(),
        updateOpen: false,
        issues: [],
        activeIssueId: null,
        checks: [],
        released: false,
        quarantinedCols: [],
        currentRunId: null,
        logs: [],
        runs: [],
        settings: DEFAULT_SETTINGS,
        uploadedCurrent: null,

        setScenario: (scenario) => set({ scenario }),
        setBaseline: (baseline) => set({ baseline, baseAnalysis: analyze(baseline, baseline, get().settings), current: null, currentAnalysis: null, remediated: null, remediatedAnalysis: null, issues: [], phase: "baseline", stages: freshStages(), version: "v1.0", previousVersion: null, released: false }),
        setUploadedCurrent: (uploadedCurrent) => set({ uploadedCurrent }),
        setSettings: (p) => {
          const settings = { ...get().settings, ...p };
          set({ settings, baseAnalysis: analyze(get().baseline, get().baseline, settings) });
        },
        reset: () => set({ version: "v1.0", previousVersion: null, current: null, currentAnalysis: null, remediated: null, remediatedAnalysis: null, issues: [], phase: "baseline", stages: freshStages(), updateSteps: freshSteps(), checks: [], released: false, quarantinedCols: [], stageProgress: 0 }),
        clearHistory: () => set({ logs: [], runs: [] }),

        updateApplication: async () => {
          if (get().running) return;
          const from = get().version;
          const to = nextVersion(from);
          set({ running: true, phase: "updating", updateSteps: freshSteps(), stages: freshStages(), issues: [], remediated: null, remediatedAnalysis: null, checks: [], released: false, currentRunId: `RUN-${uid().toUpperCase()}` });
          log({ event: "APPLICATION UPDATE", component: "Source", issue: "-", method: "-", action: `${from} → ${to}`, records: 0, status: "Started", durationMs: 0 });
          const t0 = Date.now();
          for (let i = 0; i < UPDATE_STEPS.length; i++) {
            set((s) => ({ updateSteps: s.updateSteps.map((x, j) => (j === i ? { ...x, status: "running" } : x)) }));
            await d(i === 3 ? 400 : 1100);
            if (i === 2) {
              const { uploadedCurrent, scenario, baseline, settings } = get();
              const current = uploadedCurrent ?? makeCurrent(scenario, 2000, 99 + get().runs.length);
              set({ current, currentAnalysis: analyze(current, baseline, settings) });
            }
            set((s) => ({ updateSteps: s.updateSteps.map((x, j) => (j === i ? { ...x, status: "done" } : x)) }));
          }
          set({ version: to, previousVersion: from });
          log({ event: "APPLICATION UPDATE", component: "Source", issue: "-", method: "-", action: `${from} → ${to}`, records: get().current?.rows.length ?? 0, status: "Completed", durationMs: Date.now() - t0 });
          set({ running: false });
          await d(600);
          await get().runPipeline("APPLICATION UPDATE");
        },

        runPipeline: async (trigger = "MANUAL SELF-HEALING") => {
          if (get().running) return;
          const runId = trigger === "APPLICATION UPDATE" && get().currentRunId ? get().currentRunId! : `RUN-${uid().toUpperCase()}`;
          const start = Date.now();
          const { baseline, baseAnalysis } = get();
          const source = get().current ?? baseline;
          set({ running: true, phase: "running", currentRunId: runId, stages: freshStages(), issues: [], remediated: null, remediatedAnalysis: null, checks: [], released: false, quarantinedCols: [], stageProgress: 0, activeIssueId: null });

          const stage = async (st: Stage, ms: number, fn?: () => void | Promise<void>) => {
            setStage(st, "running");
            const t = Date.now();
            await d(ms);
            await fn?.();
            setStage(st, "done");
            return Date.now() - t;
          };

          // INGEST
          let dur = await stage("INGEST", 800);
          log({ event: "INGEST", component: source.name, issue: "-", method: "Loader", action: "Read dataset", records: source.rows.length, status: "Success", durationMs: dur });
          // PROFILE
          let analysis: Analysis = get().currentAnalysis ?? baseAnalysis;
          dur = await stage("PROFILE", 900, () => {
            analysis = analyze(source, baseline, get().settings);
            set({ currentAnalysis: source === baseline ? null : analysis });
          });
          log({ event: "PROFILE", component: source.name, issue: "-", method: "Statistical Profiling", action: `${analysis.profile.columns} columns profiled`, records: analysis.profile.rows, status: "Success", durationMs: dur });
          // DETECT
          let issues: Issue[] = [];
          dur = await stage("DETECT", 1000, () => {
            const now = Date.now();
            issues = detectIssues(source, baseline, analysis, baseAnalysis, get().settings).map((i) => ({ ...i, detectedAt: now }));
            set({ issues, phase: "detected" });
          });
          for (const i of issues) log({ event: i.kind.startsWith("schema") ? "SCHEMA DRIFT" : i.kind === "drift" ? "DRIFT DETECTION" : i.kind === "anomaly" ? "ANOMALY DETECTION" : "QUALITY CHECK", component: i.column ?? "dataset", issue: i.title, method: i.detectedBy, action: i.metric, records: i.affected, status: "Detected", durationMs: i.detectedAt - start });
          if (!issues.length) log({ event: "DETECTION", component: "dataset", issue: "-", method: "All detectors", action: "No issues found", records: 0, status: "Clean", durationMs: dur });
          // DIAGNOSE
          dur = await stage("DIAGNOSE", 900, () => {
            set((s) => ({ issues: s.issues.map((i) => ({ ...i, status: get().settings.autoRemediation ? "PENDING" : "DETECTED" })) }));
          });
          for (const i of issues) log({ event: "DIAGNOSIS", component: i.column ?? "dataset", issue: i.title, method: "Rule Engine", action: `${i.cause} → ${i.action}`, records: i.affected, status: "Diagnosed", durationMs: Math.round(dur / Math.max(1, issues.length)) });

          const finishRun = (r: Partial<Run>) => {
            const st = get();
            const iss = st.issues;
            const resolved = iss.filter((i) => i.status === "RESOLVED");
            const run: Run = {
              id: runId, start, end: Date.now(), trigger, version: st.version, detected: iss.length, resolved: resolved.length,
              quarantined: iss.filter((i) => i.status === "QUARANTINED").length, validation: "SKIPPED", recovery: "AWAITING",
              mttd: iss.length ? iss.reduce((a, i) => a + (i.detectedAt - start), 0) / iss.length : 0,
              mttr: resolved.length ? resolved.reduce((a, i) => a + ((i.resolvedAt ?? i.detectedAt) - i.detectedAt), 0) / resolved.length : 0,
              qualityBefore: analysis.quality.score, qualityAfter: st.remediatedAnalysis?.quality.score ?? analysis.quality.score,
              anomaliesBefore: analysis.anomalyCount, anomaliesAfter: st.remediatedAnalysis?.anomalyCount ?? analysis.anomalyCount,
              status: "", ...r,
            };
            set((s) => ({ runs: [run, ...s.runs].slice(0, 100), running: false, activeIssueId: null }));
          };

          if (!get().settings.autoRemediation && issues.length) {
            (["REMEDIATE", "VALIDATE", "RECOVER", "RELEASE"] as Stage[]).forEach((s) => setStage(s, "skipped"));
            set({ phase: "awaiting" });
            log({ event: "REMEDIATION", component: "Engine", issue: "-", method: "-", action: "Auto-remediation OFF", records: 0, status: "Awaiting Review", durationMs: 0 });
            finishRun({ status: "AWAITING REVIEW" });
            return;
          }

          // REMEDIATE
          setStage("REMEDIATE", "running");
          set({ phase: issues.length ? "remediating" : "running" });
          let work = source;
          const quarantinedCols: string[] = [];
          for (let k = 0; k < issues.length; k++) {
            const issue = get().issues[k];
            const t = Date.now();
            patchIssue(issue.id, { status: "PROCESSING", startedAt: t, progress: 0 });
            set({ activeIssueId: issue.id });
            log({ event: "REMEDIATION", component: issue.column ?? "dataset", issue: issue.title, method: issue.detectedBy, action: issue.action, records: issue.affected, status: "Processing", durationMs: 0 });
            for (const p of [25, 50, 75]) { await d(380); patchIssue(issue.id, { progress: p }); set({ stageProgress: Math.round(((k + p / 100) / issues.length) * 100) }); }
            const res = remediate({ ...issue }, work, baseline, get().settings);
            await d(380);
            patchIssue(issue.id, { progress: 100 });
            if (res.quarantined) {
              patchIssue(issue.id, { status: "REQUIRES_REVIEW", validation: "Not safely auto-fixable" });
              log({ event: "REMEDIATION", component: issue.column ?? "dataset", issue: issue.title, method: "Rule Engine", action: "Unsafe → Requires Review", records: issue.affected, status: "Requires Review", durationMs: Date.now() - t });
              await d(700);
              work = res.ds;
              if (res.quarantineCol) quarantinedCols.push(res.quarantineCol);
              patchIssue(issue.id, { status: "QUARANTINED", validation: res.quarantineCol ? `Column '${res.quarantineCol}' quarantined; excluded from release` : "Held for human review" });
              log({ event: "QUARANTINE", component: issue.column ?? "dataset", issue: issue.title, method: "Rule Engine", action: "Quarantined", records: issue.affected, status: "Quarantined", durationMs: Date.now() - t });
              continue;
            }
            patchIssue(issue.id, { status: "VALIDATING", example: issue.example ? { ...issue.example, after: res.exampleAfter } : res.exampleAfter ? { field: issue.column ?? "", before: "—", after: res.exampleAfter } : undefined });
            log({ event: "VALIDATION", component: issue.column ?? "dataset", issue: issue.title, method: "Re-check", action: "Validation started", records: res.changed, status: "Validating", durationMs: Date.now() - t });
            await d(650);
            const v = validateIssue(issue, res.ds, baseline, baseAnalysis, get().settings);
            if (v.passed) {
              work = res.ds;
              patchIssue(issue.id, { status: "RESOLVED", resolvedAt: Date.now(), validation: `Validation passed — ${v.msg}`, affected: res.changed || issue.affected });
              log({ event: "REMEDIATION", component: issue.column ?? "dataset", issue: issue.title, method: issue.detectedBy, action: issue.action, records: res.changed, status: "Resolved", durationMs: Date.now() - t });
            } else {
              patchIssue(issue.id, { status: "FAILED", validation: `Validation failed — ${v.msg}` });
              log({ event: "REMEDIATION", component: issue.column ?? "dataset", issue: issue.title, method: issue.detectedBy, action: issue.action, records: res.changed, status: "Failed", durationMs: Date.now() - t });
            }
          }
          setStage("REMEDIATE", "done");
          set({ stageProgress: 100, activeIssueId: null, quarantinedCols });

          // VALIDATE
          setStage("VALIDATE", "running");
          const tv = Date.now();
          await d(900);
          const remediated: Dataset = { ...work, name: source.name.replace(".csv", "") + "_remediated.csv" };
          const ra = analyze(remediated, baseline, get().settings);
          const checks = validationChecks(analysis, ra, baseAnalysis, get().settings);
          const passed = checks.filter((c) => c.required).every((c) => c.passed) && !get().issues.some((i) => i.status === "FAILED");
          set({ remediated, remediatedAnalysis: ra, checks });
          setStage("VALIDATE", passed ? "done" : "failed");
          log({ event: "VALIDATION", component: "dataset", issue: "-", method: `${checks.length} checks`, action: passed ? "All checks passed" : `${checks.filter((c) => !c.passed).length} checks failed`, records: remediated.rows.length, status: passed ? "Success" : "Failed", durationMs: Date.now() - tv });

          if (!passed) {
            setStage("RECOVER", "failed");
            setStage("RELEASE", "skipped");
            set({ phase: "failed" });
            log({ event: "RELEASE", component: "Downstream", issue: "-", method: "-", action: "Release blocked — validation failed", records: 0, status: "Blocked", durationMs: 0 });
            finishRun({ validation: "FAILED", recovery: "NOT RECOVERED", status: "FAILED" });
            return;
          }
          dur = await stage("RECOVER", 800);
          log({ event: "RECOVERY", component: "Pipeline", issue: "-", method: "-", action: "Pipeline recovered", records: remediated.rows.length, status: "Recovered", durationMs: dur });
          dur = await stage("RELEASE", 700, () => set({ released: true, phase: "resolved" }));
          log({ event: "RELEASE", component: "Downstream", issue: "-", method: "-", action: "Clean data released", records: remediated.rows.length, status: "Released", durationMs: dur });
          finishRun({ validation: "PASSED", recovery: "RECOVERED", status: "RECOVERED" });
        },
      };
    },
    {
      name: "driftshield-arc",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ runs: s.runs, logs: s.logs, settings: s.settings }),
      skipHydration: true,
    },
  ),
);

export function flowIndex(s: Pick<State, "phase" | "stages" | "previousVersion" | "current">) {
  // 0 BASELINE,1 UPDATE,2 CURRENT,3 COMPARE,4 DETECT,5 DIAGNOSE,6 PROCESSING,7 REMEDIATE,8 VALIDATE,9 RESOLVED,10 RECOVERED,11 RELEASED
  if (s.phase === "baseline") return 0;
  if (s.phase === "updating") return 1;
  const st = s.stages;
  if (st.RELEASE === "done") return 12;
  if (st.RECOVER === "done") return 11;
  if (st.VALIDATE === "done") return 10;
  if (st.VALIDATE === "running" || st.VALIDATE === "failed") return 8;
  if (st.REMEDIATE === "done") return 8;
  if (st.REMEDIATE === "running") return 6;
  if (st.DIAGNOSE !== "pending") return 5;
  if (st.DETECT !== "pending") return 4;
  if (st.PROFILE !== "pending") return 3;
  return 2;
}
export const FLOW = ["BASELINE", "APP UPDATE", "CURRENT DATA", "COMPARE", "DETECT", "DIAGNOSE", "PROCESSING", "REMEDIATE", "VALIDATE", "RESOLVED", "RECOVERED", "RELEASED"];
