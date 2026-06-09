import { z } from "zod";

import { MPRS_ORDER } from "@/lib/domain/mprs";
import { LIFECYCLE_KPI_ORDER } from "@/lib/domain/lifecycle";
import { INVESTMENT_ORDER } from "@/lib/domain/investment";

/**
 * 과제 생성/편집 폼 스키마 (클라이언트 RHF + 서버 액션 공용).
 * 통화는 화면에선 억 단위, 저장은 원 단위(D-007/컨벤션) — 변환 헬퍼 제공.
 */

const EOK = 100_000_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const MPRS_VALUES = MPRS_ORDER;
export const INVESTMENT_VALUES = INVESTMENT_ORDER;
export const LIFECYCLE_VALUES = LIFECYCLE_KPI_ORDER;
export const HEALTH_VALUES = ["green", "yellow", "red"] as const;

/**
 * 선택 숫자 입력. RHF register의 setValueAs에서 "" → undefined, 문자열 → number 변환을
 * 담당하므로 여기선 단순 number().optional() — 입력/출력 타입을 일치시켜 zodResolver 호환.
 */
const optionalNumber = z
  .number({ message: "숫자를 입력하세요." })
  .min(0, "0 이상이어야 합니다.")
  .optional();

const optionalDate = z
  .union([z.literal(""), z.string().regex(DATE_RE, "날짜 형식이 올바르지 않습니다.")])
  .optional();

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(1, "과제명을 입력하세요.").max(200),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    mprs: z.enum(MPRS_VALUES, { message: "분류를 선택하세요." }),
    investmentType: z.enum(INVESTMENT_VALUES, {
      message: "과제 유형을 선택하세요.",
    }),
    headquarterId: z.string().uuid("주관 본부를 선택하세요."),
    lifecycle: z.enum(LIFECYCLE_VALUES),
    health: z.enum(HEALTH_VALUES),
    startDate: optionalDate,
    endDate: optionalDate,
    budgetEok: optionalNumber, // 억 단위
    progressPct: z
      .number({ message: "숫자를 입력하세요." })
      .int("정수여야 합니다.")
      .min(0)
      .max(100, "0~100 사이여야 합니다."),
    pmIds: z.array(z.string().uuid()),
    departmentIds: z.array(z.string().uuid()),
    aiTechIds: z.array(z.string().uuid()),
    // 사업계획 매핑: "" = 사업계획 외 과제, uuid = 해당 사업계획 항목
    budgetPlanItemId: z.string(),
  })
  .refine(
    (v) => !(v.startDate && v.endDate) || v.endDate >= v.startDate,
    { path: ["endDate"], message: "종료일은 시작일 이후여야 합니다." },
  );

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

/** 억 → 원 (저장용). undefined/0 → null */
export function eokToWon(eok: number | undefined | null): number | null {
  if (eok == null || eok === 0) return null;
  return Math.round(eok * EOK);
}

/** 원 → 억 (폼 프리필용) */
export function wonToEok(won: number | null | undefined): number | undefined {
  if (won == null) return undefined;
  return won / EOK;
}

/** 폼 기본값 (생성 모드) */
export function emptyFormValues(): ProjectFormValues {
  return {
    name: "",
    description: "",
    // 분류·투자유형은 빈 값으로 시작 → "선택하세요" 표시 + 미선택 시 검증 실패(선택 강제)
    mprs: "" as ProjectFormValues["mprs"],
    investmentType: "" as ProjectFormValues["investmentType"],
    headquarterId: "",
    lifecycle: "not_started",
    health: "green",
    startDate: "",
    endDate: "",
    budgetEok: undefined,
    progressPct: 0,
    pmIds: [],
    departmentIds: [],
    aiTechIds: [],
    budgetPlanItemId: "",
  };
}
