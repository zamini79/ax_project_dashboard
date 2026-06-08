"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBudgetEok } from "@/lib/domain/format";
import { Bar } from "@/components/charts/charts";
import type { BudgetPlanView, PlanItemView } from "@/lib/domain/budget-plan";
import {
  createPlanItemAction,
  updatePlanItemAction,
  deletePlanItemAction,
  setItemProjectsAction,
  setItemMonthlyPlanAction,
} from "@/app/(main)/budget/plan-actions";

const ACCENT = "var(--primary)";
const EOK = 100_000_000;
const wonToEok = (won: number) => (won ? Math.round((won / EOK) * 10) / 10 : 0);

export interface ProjectOption {
  id: string;
  name: string;
}

/** 투자비 사업계획 KPI 카드 + 상세 팝업 (D-031). */
export function BudgetPlanCard({
  year,
  view,
  projectOptions,
}: {
  year: number;
  view: BudgetPlanView;
  projectOptions: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-card hover:border-primary/60 flex flex-col rounded-xl border p-4 text-left transition-colors"
      >
        <p className="text-muted-foreground text-[13px]">
          {year % 100}년 투자비 사업계획
        </p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums">
          {formatBudgetEok(view.planTotal)}
        </p>
        <p className="text-primary mt-0.5 text-xs font-semibold">
          항목 {view.items.length}개 · 클릭하여 상세 ↗
        </p>
      </button>
      {open && (
        <PlanDialog
          year={year}
          view={view}
          projectOptions={projectOptions}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PlanDialog({
  year,
  view,
  projectOptions,
  onClose,
}: {
  year: number;
  view: BudgetPlanView;
  projectOptions: ProjectOption[];
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  const remain = view.planTotal - view.planExec;
  const rate = view.planTotal > 0 ? Math.round((view.planExec / view.planTotal) * 100) : 0;

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,24,48,.45)", zIndex: 120, display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "40px 16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background w-full max-w-[1100px] rounded-2xl shadow-2xl"
      >
        {/* 헤더 */}
        <div className="bg-card sticky top-0 z-[2] flex items-center justify-between rounded-t-2xl border-b px-5 py-4">
          <h2 className="text-[16px] font-extrabold">{year}년 투자비 사업계획</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-muted-foreground hover:bg-muted flex h-8 w-8 items-center justify-center rounded-lg border">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* 요약 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Summary label="계획 총액" value={formatBudgetEok(view.planTotal)} />
            <Summary label="계획 집행" value={formatBudgetEok(view.planExec)} color={ACCENT} />
            <Summary label="계획대비 미집행" value={formatBudgetEok(remain)} />
            <Summary label="집행률" value={`${rate}%`}>
              <Bar value={rate} color={ACCENT} height={6} />
            </Summary>
          </div>

          {/* 항목 추가 */}
          <AddItemForm year={year} />

          {/* 항목별 */}
          <div className="overflow-hidden rounded-xl border">
            <div className="text-muted-foreground flex h-9 items-center border-b bg-[#FAFAFB] px-3 text-[12px] font-semibold">
              <div className="flex-1">항목 / 매핑 과제</div>
              <div className="w-[90px] text-right">계획</div>
              <div className="w-[90px] text-right">집행</div>
              <div className="w-[70px] text-right">집행률</div>
              <div className="w-[80px] text-right">관리</div>
            </div>
            {view.items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-[13px]">
                등록된 사업계획 항목이 없습니다. 위에서 추가하세요.
              </p>
            ) : (
              view.items.map((it) => (
                <ItemRow key={it.id} item={it} projectOptions={projectOptions} />
              ))
            )}
          </div>

          {/* 월별 계획 vs 집행 (합산) */}
          <MonthlyTable monthly={view.monthly} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Summary({ label, value, color, children }: { label: string; value: string; color?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border p-3.5">
      <p className="text-muted-foreground text-[12px]">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums" style={color ? { color } : undefined}>{value}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

const inputCls = "border-border-strong bg-card focus-visible:ring-ring h-[34px] rounded-lg border px-2.5 text-[13px] outline-none focus-visible:ring-2";

function AddItemForm({ year }: { year: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [planEok, setPlanEok] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();

  function submit() {
    setErr(undefined);
    start(async () => {
      const r = await createPlanItemAction(year, name, Number(planEok) || 0);
      if ("error" in r) { setErr(r.error); return; }
      setName(""); setPlanEok("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed p-3">
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-muted-foreground text-[11px] font-semibold">새 항목명</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: AI 비전검사 사업" className={cn(inputCls, "w-full")} />
      </div>
      <div className="flex w-[140px] flex-col gap-1">
        <label className="text-muted-foreground text-[11px] font-semibold">연간 계획 (억)</label>
        <input type="number" step="0.1" min="0" value={planEok} onChange={(e) => setPlanEok(e.target.value)} placeholder="예: 12.5" className={cn(inputCls, "w-full")} />
      </div>
      <button type="button" onClick={submit} disabled={pending} className="bg-primary text-primary-foreground inline-flex h-[34px] items-center gap-1 rounded-lg px-3 text-[13px] font-bold disabled:opacity-50">
        <Plus size={15} /> 추가
      </button>
      {err && <p className="w-full text-xs text-red-600">{err}</p>}
    </div>
  );
}

function ItemRow({ item, projectOptions }: { item: PlanItemView; projectOptions: ProjectOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm(`'${item.name}' 항목을 삭제할까요?`)) return;
    start(async () => {
      await deletePlanItemAction(item.id);
      router.refresh();
    });
  }

  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center px-3 py-2.5 text-[13px]">
        <div className="min-w-0 flex-1 pr-2">
          <div className="font-semibold">{item.name}</div>
          <div className="text-muted-foreground truncate text-[11.5px]">
            {item.projectNames.length ? `과제 ${item.projectNames.length}: ${item.projectNames.join(", ")}` : "매핑 과제 없음"}
          </div>
        </div>
        <div className="w-[90px] text-right tabular-nums">{formatBudgetEok(item.planWon)}</div>
        <div className="w-[90px] text-right font-semibold tabular-nums">{formatBudgetEok(item.execWon)}</div>
        <div className="w-[70px] text-right tabular-nums">{item.rate}%</div>
        <div className="flex w-[80px] items-center justify-end gap-1">
          <button type="button" onClick={() => setEditing((v) => !v)} aria-label="편집" className="text-muted-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={remove} disabled={pending} aria-label="삭제" className="text-muted-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-50">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {editing && <ItemEditor item={item} projectOptions={projectOptions} onDone={() => setEditing(false)} />}
    </div>
  );
}

function ItemEditor({ item, projectOptions, onDone }: { item: PlanItemView; projectOptions: ProjectOption[]; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [planEok, setPlanEok] = useState(String(wonToEok(item.planWon) || ""));
  const [picked, setPicked] = useState<string[]>(item.projectIds);
  const [monthly, setMonthly] = useState<string[]>(item.monthly.map((m) => String(wonToEok(m.plan) || "")));
  const [showMonthly, setShowMonthly] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();

  function save() {
    setErr(undefined);
    start(async () => {
      const r1 = await updatePlanItemAction(item.id, name, Number(planEok) || 0);
      if ("error" in r1) { setErr(r1.error); return; }
      const r2 = await setItemProjectsAction(item.id, picked);
      if ("error" in r2) { setErr(r2.error); return; }
      const r3 = await setItemMonthlyPlanAction(
        item.id,
        item.monthly.map((m, i) => ({ year_month: m.ym, eok: Number(monthly[i]) || 0 })),
      );
      if ("error" in r3) { setErr(r3.error); return; }
      onDone();
      router.refresh();
    });
  }

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  return (
    <div className="bg-[#FAFAFB] flex flex-col gap-3 border-t px-3 py-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-muted-foreground text-[11px] font-semibold">항목명</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={cn(inputCls, "w-full")} />
        </div>
        <div className="flex w-[130px] flex-col gap-1">
          <label className="text-muted-foreground text-[11px] font-semibold">연간 계획 (억)</label>
          <input type="number" step="0.1" min="0" value={planEok} onChange={(e) => setPlanEok(e.target.value)} className={cn(inputCls, "w-full")} />
        </div>
      </div>

      {/* 과제 매핑 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-muted-foreground text-[11px] font-semibold">매핑 과제 (다중 선택)</label>
        {projectOptions.length === 0 ? (
          <p className="text-faint text-xs">과제가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {projectOptions.map((p) => {
              const on = picked.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => toggle(p.id)} aria-pressed={on}
                  className={cn("rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors", on ? "border-primary text-accent-foreground" : "border-border-strong text-muted-foreground hover:bg-muted")}
                  style={on ? { background: "#EEF0FB" } : undefined}>
                  {on && "✓ "}{p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 월별 계획 */}
      <div>
        <button type="button" onClick={() => setShowMonthly((v) => !v)} className="text-muted-foreground flex items-center gap-1 text-[12px] font-semibold">
          <ChevronDown size={14} className={showMonthly ? "rotate-180" : ""} /> 월별 계획 입력 (억)
        </button>
        {showMonthly && (
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {item.monthly.map((m, i) => (
              <div key={m.ym} className="flex flex-col gap-0.5">
                <span className="text-faint text-[10px]">{m.ym.slice(5)}월</span>
                <input type="number" step="0.1" min="0" value={monthly[i]} onChange={(e) => setMonthly((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))} className={cn(inputCls, "h-[30px] w-full px-1.5 text-[12px]")} />
              </div>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} disabled={pending} className="border-border-strong text-muted-foreground hover:bg-muted rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50">취소</button>
        <button type="button" onClick={save} disabled={pending} className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-[12.5px] font-bold disabled:opacity-50">{pending ? "저장 중…" : "저장"}</button>
      </div>
    </div>
  );
}

function MonthlyTable({ monthly }: { monthly: { ym: string; plan: number; exec: number }[] }) {
  const has = monthly.some((m) => m.plan > 0 || m.exec > 0);
  if (!has) return null;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <div className="text-[13px] font-bold border-b px-3 py-2.5">월별 계획 vs 집행 (단위: 억)</div>
      <table className="w-full text-[12px] tabular-nums">
        <thead>
          <tr className="text-muted-foreground bg-[#FAFAFB]">
            <th className="px-2 py-1.5 text-left font-semibold">구분</th>
            {monthly.map((m) => <th key={m.ym} className="px-2 py-1.5 text-right font-semibold">{m.ym.slice(5)}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-2 py-1.5 font-semibold">계획</td>
            {monthly.map((m) => <td key={m.ym} className="px-2 py-1.5 text-right">{m.plan ? wonToEok(m.plan) : "-"}</td>)}
          </tr>
          <tr className="border-t">
            <td className="text-primary px-2 py-1.5 font-semibold">집행</td>
            {monthly.map((m) => <td key={m.ym} className="text-primary px-2 py-1.5 text-right">{m.exec ? wonToEok(m.exec) : "-"}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
