"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { dashboardHref, type DashboardState } from "./url";
import type { SortKey } from "@/lib/domain/dashboard";

const OPTIONS: { key: SortKey | ""; label: string }[] = [
  { key: "", label: "기본 정렬" },
  { key: "name", label: "과제명" },
  { key: "mprs", label: "MPRS" },
  { key: "hq", label: "본부" },
  { key: "aitech", label: "AI기술" },
  { key: "lifecycle", label: "과제현황" },
  { key: "health", label: "진행현황" },
  { key: "schedule", label: "일정(시작일)" },
];

/** 카드 보기용 정렬 컨트롤 (드롭다운 + 방향 토글). 표 보기는 헤더 클릭 사용. */
export function SortControl({ state }: { state: DashboardState }) {
  const router = useRouter();
  const sort = state.sort ?? null;
  const dir = state.dir ?? "asc";

  function onSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as SortKey | "";
    router.push(dashboardHref(state, { sort: value || null }));
  }

  function toggleDir() {
    if (!sort) return;
    router.push(dashboardHref(state, { dir: dir === "asc" ? "desc" : "asc" }));
  }

  return (
    <div className="bg-muted inline-flex items-center rounded-md p-0.5 text-xs font-medium">
      <span className="text-muted-foreground pl-2 pr-1">정렬</span>
      <select
        value={sort ?? ""}
        onChange={onSelect}
        className="bg-card h-7 rounded border-none px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {OPTIONS.map((o) => (
          <option key={o.key || "default"} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={toggleDir}
        disabled={!sort}
        aria-label={dir === "desc" ? "내림차순" : "오름차순"}
        title={dir === "desc" ? "내림차순" : "오름차순"}
        className={cn(
          "ml-0.5 h-7 w-7 rounded transition-colors",
          sort
            ? "text-foreground hover:bg-card"
            : "text-muted-foreground/40 cursor-not-allowed",
        )}
      >
        {dir === "desc" ? "▼" : "▲"}
      </button>
    </div>
  );
}
