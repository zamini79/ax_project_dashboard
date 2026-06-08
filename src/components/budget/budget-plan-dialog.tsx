"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBudgetEok } from "@/lib/domain/format";
import { Bar } from "@/components/charts/charts";
import { INVESTMENT_ORDER, INVESTMENT_LABEL, type InvestmentType } from "@/lib/domain/investment";
import { MPRS_ORDER, MPRS_LABEL, type Mprs } from "@/lib/domain/mprs";
import type { BudgetPlanView, PlanItemView } from "@/lib/domain/budget-plan";
import {
  createPlanItemAction,
  updatePlanItemAction,
  deletePlanItemAction,
  setItemProjectsAction,
  setItemMonthlyPlanAction,
  type PlanItemForm,
} from "@/app/(main)/budget/plan-actions";

const ACCENT = "var(--primary)";
const EOK = 100_000_000;
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
/** 원 → 억 표시(소수 최대 2자리, 0/빈값은 '-') */
const eok2 = (won: number) =>
  won ? (Math.round((won / EOK) * 100) / 100).toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : "-";

export interface Option {
  id: string;
  name: string;
}

/** 투자비 사업계획 KPI 카드 + 상세 팝업 (D-031). */
export function BudgetPlanCard({
  year,
  view,
  projectOptions,
  headquarterOptions,
}: {
  year: number;
  view: BudgetPlanView;
  projectOptions: Option[];
  headquarterOptions: Option[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-card hover:border-primary/60 flex flex-col rounded-xl border p-4 text-left transition-colors"
      >
        <p className="text-muted-foreground text-[13px]">{year % 100}년 투자비 사업계획</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatBudgetEok(view.planTotal)}</p>
        <p className="text-primary mt-0.5 text-xs font-semibold">항목 {view.items.length}개 · 클릭하여 상세 ↗</p>
      </button>
      {open && (
        <PlanDialog
          year={year}
          view={view}
          projectOptions={projectOptions}
          headquarterOptions={headquarterOptions}
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
  headquarterOptions,
  onClose,
}: {
  year: number;
  view: BudgetPlanView;
  projectOptions: Option[];
  headquarterOptions: Option[];
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
      style={{ position: "fixed", inset: 0, background: "rgba(15,24,48,.45)", zIndex: 120, display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "32px 16px" }}
    >
      <div onClick={(e) => e.stopPropagation()} className="bg-background w-full max-w-[1180px] rounded-2xl shadow-2xl">
        <div className="bg-card sticky top-0 z-[2] flex items-center justify-between rounded-t-2xl border-b px-5 py-4">
          <h2 className="text-[16px] font-extrabold">{year}년 투자비 사업계획</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-muted-foreground hover:bg-muted flex h-8 w-8 items-center justify-center rounded-lg border">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Summary label="계획 총액" value={formatBudgetEok(view.planTotal)} />
            <Summary label="계획 집행" value={formatBudgetEok(view.planExec)} color={ACCENT} />
            <Summary label="계획대비 미집행" value={formatBudgetEok(remain)} />
            <Summary label="집행률" value={`${rate}%`}>
              <Bar value={rate} color={ACCENT} height={6} />
            </Summary>
          </div>

          <AddItemForm year={year} headquarterOptions={headquarterOptions} />

          <div className="overflow-x-auto rounded-xl border">
            <div className="text-muted-foreground flex h-9 min-w-[820px] items-center border-b bg-[#FAFAFB] px-3 text-[12px] font-semibold">
              <div className="w-[60px]">구분</div>
              <div className="w-[110px]">본부</div>
              <div className="w-[84px]">MPRS</div>
              <div className="flex-1">계획명 / 매핑 과제</div>
              <div className="w-[88px] text-right">총투자비</div>
              <div className="w-[88px] text-right">집행</div>
              <div className="w-[64px] text-right">집행률</div>
              <div className="w-[76px] text-right">관리</div>
            </div>
            {view.items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-[13px]">등록된 사업계획 항목이 없습니다. 위에서 추가하세요.</p>
            ) : (
              view.items.map((it) => (
                <ItemRow key={it.id} item={it} projectOptions={projectOptions} headquarterOptions={headquarterOptions} />
              ))
            )}
          </div>

          <PlanMatrix view={view} />
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

/** 원 단위 금액 입력 — 표시는 3자리 콤마, 상태는 숫자 문자열(원). */
function WonInput({
  value, onChange, placeholder, className,
}: {
  value: string; // 원 숫자 문자열 (콤마 없음)
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const display = value === "" ? "" : Number(value).toLocaleString("ko-KR");
  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
      placeholder={placeholder}
      className={className}
    />
  );
}

/** 구분/본부/MPRS 입력 묶음 */
function AttrSelects({
  inv, setInv, hq, setHq, mprs, setMprs, headquarterOptions,
}: {
  inv: string; setInv: (v: string) => void;
  hq: string; setHq: (v: string) => void;
  mprs: string; setMprs: (v: string) => void;
  headquarterOptions: Option[];
}) {
  return (
    <>
      <select value={inv} onChange={(e) => setInv(e.target.value)} className={cn(inputCls, "w-[110px]", !inv && "text-muted-foreground")}>
        <option value="" disabled hidden>구분</option>
        {INVESTMENT_ORDER.map((t) => <option key={t} value={t}>{INVESTMENT_LABEL[t]}</option>)}
      </select>
      <select value={hq} onChange={(e) => setHq(e.target.value)} className={cn(inputCls, "w-[150px]", !hq && "text-muted-foreground")}>
        <option value="" disabled hidden>본부</option>
        {headquarterOptions.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
      </select>
      <select value={mprs} onChange={(e) => setMprs(e.target.value)} className={cn(inputCls, "w-[130px]", !mprs && "text-muted-foreground")}>
        <option value="" disabled hidden>MPRS</option>
        {MPRS_ORDER.map((m) => <option key={m} value={m}>{MPRS_LABEL[m]}</option>)}
      </select>
    </>
  );
}

function buildForm(name: string, planWon: string, inv: string, hq: string, mprs: string): PlanItemForm {
  return {
    name,
    planWon: Number(planWon) || 0,
    investmentType: (inv || null) as InvestmentType | null,
    headquarterId: hq || null,
    mprs: (mprs || null) as Mprs | null,
  };
}

function AddItemForm({ year, headquarterOptions }: { year: number; headquarterOptions: Option[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [planWon, setPlanWon] = useState("");
  const [inv, setInv] = useState("");
  const [hq, setHq] = useState("");
  const [mprs, setMprs] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();

  function submit() {
    setErr(undefined);
    if (!inv || !hq || !mprs) { setErr("구분·본부·MPRS를 모두 선택하세요."); return; }
    start(async () => {
      const r = await createPlanItemAction(year, buildForm(name, planWon, inv, hq, mprs));
      if ("error" in r) { setErr(r.error); return; }
      setName(""); setPlanWon(""); setInv(""); setHq(""); setMprs("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed p-3">
      <div className="flex flex-wrap items-center gap-2">
        <AttrSelects inv={inv} setInv={setInv} hq={hq} setHq={setHq} mprs={mprs} setMprs={setMprs} headquarterOptions={headquarterOptions} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="계획명 (예: AI 비전검사 사업)" className={cn(inputCls, "min-w-[200px] flex-1")} />
        <WonInput value={planWon} onChange={setPlanWon} placeholder="총투자비(원)" className={cn(inputCls, "w-[170px] text-right")} />
        <button type="button" onClick={submit} disabled={pending} className="bg-primary text-primary-foreground inline-flex h-[34px] items-center gap-1 rounded-lg px-3 text-[13px] font-bold disabled:opacity-50">
          <Plus size={15} /> 추가
        </button>
      </div>
      {planWon && <p className="text-faint text-[11px]">총투자비 ≈ {eok2(Number(planWon) || 0)}억</p>}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

function ItemRow({ item, projectOptions, headquarterOptions }: { item: PlanItemView; projectOptions: Option[]; headquarterOptions: Option[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm(`'${item.name}' 항목을 삭제할까요?`)) return;
    start(async () => { await deletePlanItemAction(item.id); router.refresh(); });
  }

  return (
    <div className="border-b last:border-b-0">
      <div className="flex min-w-[820px] items-center px-3 py-2.5 text-[13px]">
        <div className="text-muted-foreground w-[60px] text-[12px]">{item.investmentType ? INVESTMENT_LABEL[item.investmentType] : "-"}</div>
        <div className="text-muted-foreground w-[110px] truncate text-[12px]">{item.headquarterName ?? "-"}</div>
        <div className="text-muted-foreground w-[84px] text-[12px]">{item.mprs ? MPRS_LABEL[item.mprs] : "-"}</div>
        <div className="min-w-0 flex-1 pr-2">
          <div className="font-semibold">{item.name}</div>
          <div className="text-muted-foreground truncate text-[11.5px]">
            {item.projectNames.length ? `과제 ${item.projectNames.length}: ${item.projectNames.join(", ")}` : "매핑 과제 없음"}
          </div>
        </div>
        <div className="w-[88px] text-right tabular-nums">{formatBudgetEok(item.planWon)}</div>
        <div className="w-[88px] text-right font-semibold tabular-nums">{formatBudgetEok(item.execWon)}</div>
        <div className="w-[64px] text-right tabular-nums">{item.rate}%</div>
        <div className="flex w-[76px] items-center justify-end gap-1">
          <button type="button" onClick={() => setEditing((v) => !v)} aria-label="편집" className="text-muted-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border"><Pencil size={13} /></button>
          <button type="button" onClick={remove} disabled={pending} aria-label="삭제" className="text-muted-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-50"><Trash2 size={13} /></button>
        </div>
      </div>
      {editing && <ItemEditor item={item} projectOptions={projectOptions} headquarterOptions={headquarterOptions} onDone={() => setEditing(false)} />}
    </div>
  );
}

function ItemEditor({ item, projectOptions, headquarterOptions, onDone }: { item: PlanItemView; projectOptions: Option[]; headquarterOptions: Option[]; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [planWon, setPlanWon] = useState(String(item.planWon || ""));
  const [inv, setInv] = useState<string>(item.investmentType ?? "");
  const [hq, setHq] = useState<string>(item.headquarterId ?? "");
  const [mprs, setMprs] = useState<string>(item.mprs ?? "");
  const [picked, setPicked] = useState<string[]>(item.projectIds);
  const [monthly, setMonthly] = useState<string[]>(item.monthly.map((m) => String(m.plan || "")));
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();

  function save() {
    setErr(undefined);
    if (!inv || !hq || !mprs) { setErr("구분·본부·MPRS를 모두 선택하세요."); return; }
    start(async () => {
      const r1 = await updatePlanItemAction(item.id, buildForm(name, planWon, inv, hq, mprs));
      if ("error" in r1) { setErr(r1.error); return; }
      const r2 = await setItemProjectsAction(item.id, picked);
      if ("error" in r2) { setErr(r2.error); return; }
      const r3 = await setItemMonthlyPlanAction(item.id, item.monthly.map((m, i) => ({ year_month: m.key, won: Number(monthly[i]) || 0 })));
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
      <div className="flex flex-wrap items-center gap-2">
        <AttrSelects inv={inv} setInv={setInv} hq={hq} setHq={setHq} mprs={mprs} setMprs={setMprs} headquarterOptions={headquarterOptions} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="계획명" className={cn(inputCls, "min-w-[200px] flex-1")} />
        <div className="flex flex-col">
          <WonInput value={planWon} onChange={setPlanWon} placeholder="총투자비(원)" className={cn(inputCls, "w-[170px] text-right")} />
          {planWon && <span className="text-faint text-[10px]">≈ {eok2(Number(planWon) || 0)}억</span>}
        </div>
      </div>

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

      <div className="flex flex-col gap-1.5">
        <label className="text-muted-foreground text-[11px] font-semibold">
          월별 투자비 계획 (원) — 전년 · 1~12월 · 차년 &nbsp;<span className="text-faint font-normal">실적은 매핑 과제에서 자동(아래 회색, 억)</span>
        </label>
        <div className="grid grid-cols-7 gap-1.5">
          {item.monthly.map((m, i) => (
            <div key={m.key} className="flex flex-col gap-0.5">
              <span className="text-faint text-[10px]">{m.label}</span>
              <WonInput value={monthly[i]} onChange={(raw) => setMonthly((arr) => arr.map((v, j) => (j === i ? raw : v)))} className={cn(inputCls, "h-[30px] w-full px-1.5 text-right text-[12px]")} />
              <span className="text-faint text-right text-[9.5px] tabular-nums">실 {eok2(m.exec)}</span>
            </div>
          ))}
        </div>
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} disabled={pending} className="border-border-strong text-muted-foreground hover:bg-muted rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50">취소</button>
        <button type="button" onClick={save} disabled={pending} className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-[12.5px] font-bold disabled:opacity-50">{pending ? "저장 중…" : "저장"}</button>
      </div>
    </div>
  );
}

/** 항목 × 월 스프레드시트 (계획/실적 토글). 행=계획별, 열=전년·1~12월·차년, 합계 포함. */
function PlanMatrix({ view }: { view: BudgetPlanView }) {
  const [mode, setMode] = useState<"plan" | "exec">("plan");
  if (view.items.length === 0) return null;

  const val = (m: { plan: number; exec: number }) => (mode === "plan" ? m.plan : m.exec);
  const cell = eok2;
  const colTotals = view.monthly.map((_, ci) => sum(view.items.map((it) => val(it.monthly[ci]))));
  const grand = sum(colTotals);

  const tab = (m: "plan" | "exec", label: string) => (
    <button type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
      className={cn("rounded-md px-3 py-1 transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <span className="text-[13px] font-bold">계획별 월별 {mode === "plan" ? "계획" : "실적"} (단위: 억)</span>
        <div className="bg-card inline-flex gap-1 rounded-lg border p-0.5 text-[12px] font-semibold">
          {tab("plan", "계획")}
          {tab("exec", "실적")}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-[12px] tabular-nums">
          <thead>
            <tr className="text-muted-foreground bg-[#FAFAFB]">
              <th className="px-2 py-1.5 text-left font-semibold">계획명</th>
              {view.monthly.map((m) => <th key={m.key} className="px-2 py-1.5 text-right font-semibold">{m.label}</th>)}
              <th className="px-2 py-1.5 text-right font-semibold">합계</th>
            </tr>
          </thead>
          <tbody>
            {view.items.map((it) => {
              const rowTotal = sum(it.monthly.map(val));
              return (
                <tr key={it.id} className="border-t">
                  <td className="px-2 py-1.5 font-semibold whitespace-nowrap">{it.name}</td>
                  {it.monthly.map((m) => (
                    <td key={m.key} className={cn("px-2 py-1.5 text-right", mode === "exec" && "text-primary")}>{cell(val(m))}</td>
                  ))}
                  <td className="px-2 py-1.5 text-right font-bold">{cell(rowTotal)}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 font-bold">
              <td className="px-2 py-1.5">합계</td>
              {colTotals.map((t, ci) => <td key={ci} className="px-2 py-1.5 text-right">{cell(t)}</td>)}
              <td className="px-2 py-1.5 text-right">{cell(grand)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
