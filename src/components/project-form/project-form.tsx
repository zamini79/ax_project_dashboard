"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MultiSelect } from "./multi-select";
import {
  projectFormSchema,
  type ProjectFormValues,
  MPRS_VALUES,
  LIFECYCLE_VALUES,
  HEALTH_VALUES,
} from "@/lib/domain/project-form";
import { MPRS_LABEL } from "@/lib/domain/mprs";
import { LIFECYCLE_LABEL, HEALTH_LABEL } from "@/lib/domain/lifecycle";
import type { MasterOption, PersonOption } from "@/lib/repositories/masters";
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/projects/actions";

const selectClass =
  "border-input bg-card focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2";

/** "" → undefined, 그 외 → number (NaN이면 zod가 에러 처리) */
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
}: {
  mode: "create" | "edit";
  projectId?: string;
  defaultValues: ProjectFormValues;
  headquarters: MasterOption[];
  people: PersonOption[];
  departments: MasterOption[];
  aiTechs: MasterOption[];
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
        : await updateProjectAction(projectId!, values);
    // 성공 시 서버 액션이 redirect → 아래는 실패한 경우만 도달
    if (result?.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        {/* 과제명 */}
        <Field label="과제명" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="예: 스마트팩토리 비전검사 고도화" />
        </Field>

        {/* 설명 */}
        <Field label="설명" error={errors.description?.message}>
          <Textarea {...register("description")} rows={3} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* MPRS */}
          <Field label="분류 (MPRS)" required error={errors.mprs?.message}>
            <select className={selectClass} {...register("mprs")}>
              {MPRS_VALUES.map((m) => (
                <option key={m} value={m}>
                  {MPRS_LABEL[m]}
                </option>
              ))}
            </select>
          </Field>

          {/* 주관 본부 */}
          <Field label="주관 본부" required error={errors.headquarterId?.message}>
            <select className={selectClass} {...register("headquarterId")}>
              <option value="">선택하세요</option>
              {headquarters.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>

          {/* 라이프사이클 */}
          <Field label="라이프사이클" required error={errors.lifecycle?.message}>
            <select className={selectClass} {...register("lifecycle")}>
              {LIFECYCLE_VALUES.map((l) => (
                <option key={l} value={l}>
                  {LIFECYCLE_LABEL[l]}
                </option>
              ))}
            </select>
          </Field>

          {/* 헬스 */}
          <Field label="헬스" required error={errors.health?.message}>
            <select className={selectClass} {...register("health")}>
              {HEALTH_VALUES.map((h) => (
                <option key={h} value={h}>
                  {HEALTH_LABEL[h]}
                </option>
              ))}
            </select>
          </Field>

          {/* 시작일 */}
          <Field label="시작일" error={errors.startDate?.message}>
            <Input type="date" {...register("startDate")} />
          </Field>

          {/* 종료일 */}
          <Field label="종료일" error={errors.endDate?.message}>
            <Input type="date" {...register("endDate")} />
          </Field>

          {/* 투자비 (억) */}
          <Field label="투자비 (억원)" error={errors.budgetEok?.message}>
            <Input
              type="number"
              step="0.1"
              min="0"
              {...register("budgetEok", { setValueAs: numOrUndef })}
              placeholder="예: 12.5"
            />
          </Field>

          {/* FTE */}
          <Field label="투입 인원 (FTE)" error={errors.fte?.message}>
            <Input
              type="number"
              step="0.5"
              min="0"
              {...register("fte", { setValueAs: numOrUndef })}
              placeholder="예: 2"
            />
          </Field>

          {/* 진행률 */}
          <Field label="진행률 (%)" required error={errors.progressPct?.message}>
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              {...register("progressPct", { setValueAs: numOrUndef })}
            />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold">담당 / 분류</h2>

        {/* PM */}
        <Field label="PM (공동 가능)" error={errors.pmIds?.message}>
          <Controller
            control={control}
            name="pmIds"
            render={({ field }) => (
              <MultiSelect
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

        {/* 유관부서 */}
        <Field label="유관부서 (담당자는 미정으로 저장)" error={errors.departmentIds?.message}>
          <Controller
            control={control}
            name="departmentIds"
            render={({ field }) => (
              <MultiSelect
                options={departments.map((d) => ({ id: d.id, label: d.name }))}
                value={field.value}
                onChange={field.onChange}
                emptyText="등록된 부서가 없습니다."
              />
            )}
          />
        </Field>

        {/* AI기술 */}
        <Field label="AI기술" error={errors.aiTechIds?.message}>
          <Controller
            control={control}
            name="aiTechIds"
            render={({ field }) => (
              <MultiSelect
                options={aiTechs.map((t) => ({ id: t.id, label: t.name }))}
                value={field.value}
                onChange={field.onChange}
                emptyText="등록된 AI기술이 없습니다."
              />
            )}
          />
        </Field>
      </Card>

      {serverError && (
        <p className="text-sm text-red-600">{serverError}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중…" : mode === "create" ? "과제 등록" : "저장"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={cn(error && "text-red-600")}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
