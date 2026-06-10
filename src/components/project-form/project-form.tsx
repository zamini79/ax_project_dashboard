"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  projectFormSchema,
  type ProjectFormValues,
  MPRS_VALUES,
  INVESTMENT_VALUES,
  LIFECYCLE_VALUES,
  HEALTH_VALUES,
} from "@/lib/domain/project-form";
import { MPRS_LABEL } from "@/lib/domain/mprs";
import { INVESTMENT_LABEL } from "@/lib/domain/investment";
import { ExecutionEditor } from "@/components/project-detail/execution-editor";
import { LIFECYCLE_LABEL, HEALTH_LABEL } from "@/lib/domain/lifecycle";
import type { MasterOption, PersonOption } from "@/lib/repositories/masters";
import {
  createProjectAction,
  createProjectModalAction,
  updateProjectAction,
  updateProjectModalAction,
} from "@/app/projects/actions";

const inputClass =
  "border-border-strong bg-card focus-visible:ring-ring h-[38px] w-full rounded-[9px] border px-3 text-[13.5px] outline-none focus-visible:ring-2";
const EOK = 100_000_000; // 투자비: 폼은 억 단위 보관, 입력/표시는 원 단위
const searchInputClass =
  "border-border-strong bg-card focus-visible:ring-ring h-[34px] w-[220px] rounded-[9px] border px-3 text-[13px] outline-none focus-visible:ring-2";

export function ProjectForm({
  mode,
  projectId,
  defaultValues,
  headquarters,
  people,
  departments,
  aiTechs,
  tags,
  planItems,
  executions = [],
  returnTo,
  onSuccess,
  onCancel,
  formId,
  onDirtyChange,
}: {
  mode: "create" | "edit";
  projectId?: string;
  defaultValues: ProjectFormValues;
  headquarters: MasterOption[];
  people: PersonOption[];
  departments: MasterOption[];
  aiTechs: MasterOption[];
  tags: MasterOption[];
  /** 사업계획 매핑 콤보 옵션 (전체 연도; 폼에서 연도별 필터) */
  planItems: { id: string; name: string; fiscalYear: number }[];
  /** 집행 실적(편집 모드) — 비정기 지급 목록 */
  executions?: { id: string; year_month: string; amount: number }[];
  /** 편집 진입 출처 — 저장/취소 시 이곳으로 복귀 (목록·드로어·상세) */
  returnTo?: string;
  /** 모달(임베드) 모드: 생성 성공 시 redirect 대신 호출 → 모달 닫고 배경 갱신 */
  onSuccess?: (id: string) => void;
  /** 모달 모드 취소 핸들러 (없으면 router.back) */
  onCancel?: () => void;
  /** 외부(모달)에서 폼을 submit 하기 위한 form id */
  formId?: string;
  /** 입력 변경(dirty) 여부 보고 — 모달의 외부 클릭 가드용 */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  // 사업계획 연도 필터 (기본: 선택된 계획의 연도, 없으면 올해)
  const currentYear = new Date().getFullYear();
  const [planYear, setPlanYear] = useState<number>(
    planItems.find((p) => p.id === defaultValues.budgetPlanItemId)
      ?.fiscalYear ?? currentYear,
  );
  const planYears = Array.from(
    new Set([currentYear, ...planItems.map((p) => p.fiscalYear)]),
  ).sort((a, b) => b - a);
  const [selectedPlan, setSelectedPlan] = useState(
    defaultValues.budgetPlanItemId,
  );

  const lifecycle = useWatch({ control, name: "lifecycle" });
  // "운영" 단계일 때만 성과 현황 추가 체크박스 노출
  const isOperating = lifecycle === "operating";
  // 완료·운영이면 진행상태/진행률을 자동 완료 처리(아래 useEffect) + 입력 잠금
  const isDone = lifecycle === "completed" || lifecycle === "operating";

  // 완료/운영 전환 시: 진행상태=완료, 진행률=100 으로 자동 설정하고
  // 직전 값(진행상태·진행률)을 보관했다가 다른 단계로 바꾸면 복원.
  const doneStash = useRef<{
    health: ProjectFormValues["health"];
    progressPct: number;
  } | null>(null);
  const wasDone = useRef(
    defaultValues.lifecycle === "completed" ||
      defaultValues.lifecycle === "operating",
  );

  useEffect(() => {
    if (isDone && !wasDone.current) {
      doneStash.current = {
        health: getValues("health"),
        progressPct: getValues("progressPct"),
      };
      setValue("health", "completed", { shouldDirty: true });
      setValue("progressPct", 100, { shouldDirty: true });
    } else if (!isDone && wasDone.current) {
      if (doneStash.current) {
        setValue("health", doneStash.current.health, { shouldDirty: true });
        setValue("progressPct", doneStash.current.progressPct, {
          shouldDirty: true,
        });
        doneStash.current = null;
      }
    }
    wasDone.current = isDone;
  }, [isDone, getValues, setValue]);

  // 입력 변경 여부를 모달에 보고 (외부 클릭 시 저장 확인용)
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  async function onValid(values: ProjectFormValues) {
    setServerError(undefined);
    // 모달 모드: redirect 없이 결과만 받고 모달 닫기 + 배경 갱신
    if (onSuccess) {
      if (mode === "create") {
        const result = await createProjectModalAction(values);
        if ("error" in result) setServerError(result.error);
        else onSuccess(result.id);
      } else {
        const result = await updateProjectModalAction(projectId!, values);
        if ("error" in result) setServerError(result.error);
        else onSuccess(projectId!);
      }
      return;
    }
    const result =
      mode === "create"
        ? await createProjectAction(values)
        : await updateProjectAction(projectId!, values, returnTo);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onValid)}
      className="flex flex-col gap-3.5"
    >
      {/* 기본 정보 */}
      <Card className="p-[22px]">
        <h2 className="mb-4 text-[13px] font-bold">기본 정보</h2>
        <div className="flex flex-col gap-5">
          {/* 상단: 좌(과제명·설명) / 우(담당·분류) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
            <div className="flex flex-col gap-4">
              <Field label="과제명" required full error={errors.name?.message}>
                <input
                  {...register("name")}
                  placeholder="예: 스마트팩토리 비전검사 고도화"
                  className={inputClass}
                />
              </Field>
              <Field label="설명" full error={errors.description?.message}>
                <textarea
                  {...register("description")}
                  rows={6}
                  placeholder="과제 개요를 입력하세요"
                  className={cn(
                    inputClass,
                    "h-auto resize-y py-2.5 leading-relaxed",
                  )}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-[18px]">
              <Field label="PM (공동 가능)" error={errors.pmIds?.message}>
                <Controller
                  control={control}
                  name="pmIds"
                  render={({ field }) => (
                    <SearchSelect
                      options={people.map((p) => ({
                        id: p.id,
                        label: p.name,
                        hint: p.department,
                        keywords: p.email ?? "",
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="이름 또는 이메일로 검색"
                      addLabel="PM 추가"
                      emptyText="등록된 사람이 없습니다."
                    />
                  )}
                />
              </Field>
              <Field label="유관부서" error={errors.departmentIds?.message}>
                <Controller
                  control={control}
                  name="departmentIds"
                  render={({ field }) => (
                    <SearchSelect
                      options={departments.map((d) => ({
                        id: d.id,
                        label: d.name,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="부서명으로 검색"
                      addLabel="부서 추가"
                      emptyText="등록된 부서가 없습니다."
                    />
                  )}
                />
              </Field>
              <Field label="AI기술" error={errors.aiTechIds?.message}>
                <Controller
                  control={control}
                  name="aiTechIds"
                  render={({ field }) => (
                    <ChipMultiSelect
                      options={aiTechs.map((t) => ({
                        id: t.id,
                        label: t.name,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      emptyText="등록된 AI기술이 없습니다."
                    />
                  )}
                />
              </Field>
              <Field label="속성" error={errors.tagIds?.message}>
                <Controller
                  control={control}
                  name="tagIds"
                  render={({ field }) => (
                    <ChipMultiSelect
                      options={tags.map((t) => ({ id: t.id, label: t.name }))}
                      value={field.value}
                      onChange={field.onChange}
                      emptyText="등록된 속성이 없습니다."
                    />
                  )}
                />
              </Field>
              <p className="text-faint flex items-center gap-1.5 text-xs">
                <span className="text-primary">＋</span> 목록에 없으면{" "}
                <b className="text-muted-foreground">마스터 관리</b>에서 추가할
                수 있어요.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="분류 (MPRS)" required error={errors.mprs?.message}>
              <select className={inputClass} {...register("mprs")}>
                <option value="" hidden>
                  선택하세요
                </option>
                {MPRS_VALUES.map((m) => (
                  <option key={m} value={m}>
                    {MPRS_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="과제 유형"
              required
              error={errors.investmentType?.message}
            >
              <select className={inputClass} {...register("investmentType")}>
                <option value="" hidden>
                  선택하세요
                </option>
                {INVESTMENT_VALUES.map((t) => (
                  <option key={t} value={t}>
                    {INVESTMENT_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="대상 본부"
              required
              error={errors.headquarterId?.message}
            >
              <select className={inputClass} {...register("headquarterId")}>
                <option value="" hidden>
                  선택하세요
                </option>
                {headquarters.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Field label="진행 현황" required error={errors.lifecycle?.message}>
              <div className="flex items-center gap-2">
                <select
                  className={cn(inputClass, isOperating && "w-[52%] shrink-0")}
                  {...register("lifecycle")}
                >
                  {LIFECYCLE_VALUES.map((l) => (
                    <option key={l} value={l}>
                      {LIFECYCLE_LABEL[l]}
                    </option>
                  ))}
                </select>
                {isOperating && (
                  <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium">
                    <input
                      type="checkbox"
                      className="accent-primary h-4 w-4"
                      {...register("addToPerformance")}
                    />
                    성과 현황 추가
                  </label>
                )}
              </div>
            </Field>
            <Field label="진행 상태" required error={errors.health?.message}>
              <select
                className={cn(inputClass, "disabled:opacity-60")}
                disabled={isDone}
                title={
                  isDone ? "완료·운영 단계는 진행 상태가 완료로 고정됩니다." : undefined
                }
                {...register("health")}
              >
                {HEALTH_VALUES.map((h) => (
                  <option key={h} value={h}>
                    {HEALTH_LABEL[h]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="시작일" error={errors.startDate?.message}>
              <input
                type="date"
                {...register("startDate")}
                className={inputClass}
              />
            </Field>
            <Field label="종료일" error={errors.endDate?.message}>
              <input
                type="date"
                {...register("endDate")}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="budgetEok"
              render={({ field }) => {
                const won =
                  field.value != null && !Number.isNaN(field.value)
                    ? Math.round(field.value * EOK)
                    : undefined;
                return (
                  <Field label="투자비 (원)" error={errors.budgetEok?.message}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={won != null ? won.toLocaleString("ko-KR") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        field.onChange(
                          raw === "" ? undefined : Number(raw) / EOK,
                        );
                      }}
                      placeholder="예: 1,250,000,000"
                      className={inputClass}
                    />
                  </Field>
                );
              }}
            />
            <Field label="사업계획" error={errors.budgetPlanItemId?.message}>
              <div className="flex gap-2">
                <select
                  className={cn(
                    inputClass,
                    "w-[96px] shrink-0 disabled:opacity-50",
                  )}
                  value={planYear}
                  disabled={!selectedPlan}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setPlanYear(y);
                    // 연도 변경 시 해당 연도에 선택값이 없으면 그 연도 첫 계획으로(없으면 사업계획 외)
                    const yearPlans = planItems.filter(
                      (p) => p.fiscalYear === y,
                    );
                    if (!yearPlans.some((p) => p.id === selectedPlan)) {
                      const next = yearPlans[0]?.id ?? "";
                      setValue("budgetPlanItemId", next);
                      setSelectedPlan(next);
                    }
                  }}
                >
                  {planYears.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
                <select
                  className={cn(inputClass, "min-w-0 flex-1")}
                  {...register("budgetPlanItemId", {
                    onChange: (e) => setSelectedPlan(e.target.value),
                  })}
                >
                  {planItems
                    .filter((p) => p.fiscalYear === planYear)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  <option value="">사업계획 외 과제</option>
                </select>
              </div>
            </Field>
          </div>
        </div>
      </Card>

      {/* 진행률 / 집행 실적 */}
      <Card className="p-[22px]">
        <Controller
          control={control}
          name="progressPct"
          render={({ field }) => (
            <Field
              label={`진행률 (${field.value ?? 0}%)${isDone ? " · 완료/운영 고정" : ""}`}
              full
              error={errors.progressPct?.message}
            >
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={field.value ?? 0}
                onChange={(e) => field.onChange(Number(e.target.value))}
                disabled={isDone}
                className="accent-primary w-full disabled:opacity-50"
              />
            </Field>
          )}
        />
        {mode === "edit" && projectId && (
          <div className="mt-4 border-t pt-4">
            <ExecutionEditor projectId={projectId} entries={executions} />
          </div>
        )}
      </Card>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          onClick={() =>
            onCancel
              ? onCancel()
              : returnTo
                ? router.push(returnTo)
                : router.back()
          }
          disabled={isSubmitting}
          className="border-border-strong text-muted-foreground hover:bg-muted rounded-[10px] border px-[18px] py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground rounded-[10px] px-5 py-2.5 text-[13px] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "저장 중…" : mode === "create" ? "과제 등록" : "저장"}
        </button>
      </div>
    </form>
  );
}

interface ChipOption {
  id: string;
  label: string;
  hint?: string | null;
}

function ChipMultiSelect({
  options,
  value,
  onChange,
  emptyText,
}: {
  options: ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyText: string;
}) {
  if (options.length === 0) {
    return (
      <p className="text-faint rounded-md border border-dashed px-3 py-2 text-xs">
        {emptyText}
      </p>
    );
  }
  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
              on
                ? "border-primary text-accent-foreground"
                : "border-border-strong text-muted-foreground hover:bg-muted",
            )}
            style={on ? { background: "#EEF0FB" } : undefined}
          >
            {on && <span className="text-[10px]">✓</span>}
            {o.label}
            {o.hint && (
              <span className="text-faint font-normal">· {o.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SearchOption {
  id: string;
  label: string;
  hint?: string | null;
  keywords?: string; // 추가 검색 키워드(예: 이메일)
}

/** 검색 후 선택하는 다중 선택 (칩 + ＋추가 버튼 → 검색 드롭다운). */
function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  addLabel,
  emptyText,
}: {
  options: SearchOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
  emptyText: string;
}) {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [hi, setHi] = useState(-1); // 키보드 하이라이트 인덱스
  const triggerRef = useRef<HTMLDivElement>(null);

  // 펼칠 때 아래 공간이 부족하면 위로 (기본은 아래)
  useEffect(() => {
    if (!adding) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const DROPDOWN = 240; // max-h-56 ≈ 224 + 여백
    setDropUp(spaceBelow < DROPDOWN && rect.top > spaceBelow);
  }, [adding]);

  if (options.length === 0) {
    return (
      <p className="text-faint rounded-md border border-dashed px-3 py-2 text-xs">
        {emptyText}
      </p>
    );
  }

  const selected = value
    .map((id) => options.find((o) => o.id === id))
    .filter((o): o is SearchOption => !!o);
  const query = q.trim().toLowerCase();
  const matches = options
    .filter(
      (o) =>
        !value.includes(o.id) &&
        (!query ||
          `${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`
            .toLowerCase()
            .includes(query)),
    )
    .slice(0, 8);
  const pick = (o: SearchOption) => {
    onChange([...value, o.id]);
    setQ("");
    setAdding(false);
    setHi(-1);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.map((o) => (
        <span
          key={o.id}
          className="border-primary text-accent-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold"
          style={{ background: "#EEF0FB" }}
        >
          {o.label}
          {o.hint && <span className="text-faint font-normal">· {o.hint}</span>}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== o.id))}
            aria-label={`${o.label} 제거`}
            className="text-muted-foreground hover:text-foreground ml-0.5 text-sm leading-none"
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <div className="relative" ref={triggerRef}>
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setHi(-1);
            }}
            onBlur={() =>
              setTimeout(() => {
                setAdding(false);
                setQ("");
                setHi(-1);
              }, 150)
            }
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAdding(false);
                setQ("");
                setHi(-1);
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHi((h) => Math.min(h + 1, matches.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHi((h) => Math.max(h - 1, 0));
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (matches.length === 0) return;
                if (matches.length === 1) {
                  pick(matches[0]);
                  return;
                }
                if (hi < 0) {
                  setHi(0);
                  return;
                }
                pick(matches[hi]);
              }
            }}
            placeholder={placeholder}
            className={searchInputClass}
          />
          <div
            className={cn(
              "bg-card absolute left-0 z-20 max-h-56 w-[280px] overflow-auto rounded-lg border shadow-lg",
              dropUp ? "bottom-full mb-1" : "top-full mt-1",
            )}
          >
            {matches.length === 0 ? (
              <p className="text-faint px-3 py-2 text-xs">검색 결과 없음</p>
            ) : (
              matches.map((o, i) => (
                <button
                  key={o.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(o)}
                  className={cn(
                    "flex w-full items-center gap-1.5 px-3 py-2 text-left text-[13px]",
                    i === hi ? "bg-muted" : "hover:bg-muted",
                  )}
                >
                  <span className="text-primary">＋</span>
                  <span className="font-medium">{o.label}</span>
                  {o.hint && (
                    <span className="text-faint text-xs">· {o.hint}</span>
                  )}
                  {o.keywords && (
                    <span className="text-faint ml-auto truncate pl-2 text-[11px]">
                      {o.keywords}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border-border-strong text-muted-foreground hover:bg-muted inline-flex w-fit items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
        >
          <span className="text-primary">＋</span> {addLabel}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  required = false,
  full = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-[7px]", full && "sm:col-span-2")}>
      <label
        className={cn(
          "text-xs font-semibold",
          error ? "text-red-600" : "text-muted-foreground",
        )}
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
