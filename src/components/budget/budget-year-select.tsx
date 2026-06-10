"use client";

import { useRouter } from "next/navigation";

/**
 * 투자비 현황 연도 선택. 선택 시 ?year=Y 로 이동 → 페이지 전체가 해당 연도
 * 사업계획 기준으로 재계산된다. (정렬/드로어 파라미터는 연도 변경 시 초기화)
 */
export function BudgetYearSelect({
  year,
  years,
}: {
  year: number;
  years: number[];
}) {
  const router = useRouter();
  return (
    <select
      value={year}
      onChange={(e) => router.push(`/budget?year=${e.target.value}`)}
      aria-label="사업계획 연도 선택"
      className="border-border-strong bg-card focus-visible:ring-ring h-8 rounded-lg border px-2.5 text-[13px] font-semibold outline-none focus-visible:ring-2"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}년
        </option>
      ))}
    </select>
  );
}
