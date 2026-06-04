"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { LIFECYCLE_LABEL, HEALTH_LABEL } from "@/lib/domain/lifecycle";
import type { MasterOption, PersonOption } from "@/lib/repositories/masters";
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/projects/actions";

const inputClass =
  "border-border-strong bg-card focus-visible:ring-ring h-[38px] w-full rounded-[9px] border px-3 text-[13.5px] outline-none focus-visible:ring-2";
const numOrUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

export function ProjectForm({
  mode,
  projectId,
  defaultValues,
  headquarters,
  people,
  departments,
  aiTechs,
  returnTo,
}: {
  mode: "create" | "edit";
  projectId?: string;
  defaultValues: ProjectFormValues;
  headquarters: MasterOption[];
  people: PersonOption[];
  departments: MasterOption[];
  aiTechs: MasterOption[];
  /** 편집 진입 출처 — 저장/취소 시 이곳으로 복귀 (목록·드로어·상세) */
  returnTo?: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  async function onValid(values: ProjectFormValues) {
    setServerError(undefined);
    const result =
      mode === "create"
        ? await createProjectAction(values)
        : await updateProjectAction(projectId!, values, returnTo);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-3.5">
      {/* 기본 정보 */}
      <Card className="p-[22px]">
        <h2 className="mb-4 text-[13px] font-bold">기본 정보</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              rows={2}
              placeholder="과제 개요를 입력하세요"
              className={cn(inputClass, "h-auto resize-y py-2.5 leading-relaxed")}
            />
          </Field>

          <Field label="분류 (MPRS)" required error={errors.mprs?.message}>
            <select className={inputClass} {...register("mprs")}>
              {MPRS_VALUES.map((m) => (
                <option key={m} value={m}>
                  {MPRS_LABEL[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="투자 유형" required error={errors.investmentType?.message}>
            <select className={inputClass} {...register("investmentType")}>
              {INVESTMENT_VALUES.map((t) => (
                <option key={t} value={t}>
                  {INVESTMENT_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="주관 본부" required error={errors.headquarterId?.message}>
            <select className={inputClass} {...register("headquarterId")}>
              <option value="">선택하세요</option>
              {headquarters.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="라이프사이클" required error={errors.lifecycle?.message}>
            <select className={inputClass} {...register("lifecycle")}>
              {LIFECYCLE_VALUES.map((l) => (
                <option key={l} value={l}>
                  {LIFECYCLE_LABEL[l]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="헬스" required error={errors.health?.message}>
            <select className={inputClass} {...register("health")}>
              {HEALTH_VALUES.map((h) => (
                <option key={h} value={h}>
                  {HEALTH_LABEL[h]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="시작일" error={errors.startDate?.message}>
            <input type="date" {...register("startDate")} className={inputClass} />
          </Field>
          <Field label="종료일" error={errors.endDate?.message}>
            <input type="date" {...register("endDate")} className={inputClass} />
          </Field>

          <Field label="투자비 (억원)" error={errors.budgetEok?.message}>
            <input
              type="number"
              step="0.1"
              min="0"
              {...register("budgetEok", { setValueAs: numOrUndef })}
              placeholder="예: 12.5"
              className={inputClass}
            />
          </Field>
          <Field label="투입 인원 (FTE)" error={errors.fte?.message}>
            <input
              type="number"
              step="0.5"
              min="0"
              {...register("fte", { setValueAs: numOrUndef })}
              placeholder="예: 2"
              className={inputClass}
            />
          </Field>

          <Controller
            control={control}
            name="progressPct"
            render={({ field }) => (
              <Field
                label={`진행률 (${field.value ?? 0}%)`}
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
                  className="accent-primary w-full"
                />
              </Field>
            )}
          />
        </div>
      </Card>

      {/* 담당 / 분류 */}
      <Card className="p-[22px]">
        <h2 className="mb-4 text-[13px] font-bold">담당 / 분류</h2>
        <div className="flex flex-col gap-[18px]">
          <Field label="PM (공동 가능)" error={errors.pmIds?.message}>
            <Controller
              control={control}
              name="pmIds"
              render={({ field }) => (
                <ChipMultiSelect
                  options={people.map((p) => ({
                    id: p.id,
                    label: p.name,
                    hint: p.department,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
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
                <ChipMultiSelect
                  options={departments.map((d) => ({ id: d.id, label: d.name }))}
                  value={field.value}
                  onChange={field.onChange}
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
                  options={aiTechs.map((t) => ({ id: t.id, label: t.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  emptyText="등록된 AI기술이 없습니다."
                />
              )}
            />
          </Field>
        </div>
        <p className="text-faint mt-4 flex items-center gap-1.5 border-t pt-3.5 text-xs">
          <span className="text-primary">＋</span> 목록에 없으면{" "}
          <b className="text-muted-foreground">마스터 관리</b>에서 추가할 수 있어요.
        </p>
      </Card>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          onClick={() => (returnTo ? router.push(returnTo) : router.back())}
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
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
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
            {o.hint && <span className="text-faint font-normal">· {o.hint}</span>}
          </button>
        );
      })}
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
      <label className={cn("text-xs font-semibold", error ? "text-red-600" : "text-muted-foreground")}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
