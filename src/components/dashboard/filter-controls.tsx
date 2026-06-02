import Link from "next/link";

import { cn } from "@/lib/utils";
import type { DashboardFilter } from "@/lib/domain/dashboard";
import { LIFECYCLE_LABEL, HEALTH_LABEL } from "@/lib/domain/lifecycle";
import { dashboardHref, type GroupMode, type ViewMode } from "./url";
import { SortControl } from "./sort-control";
import { ScheduleHomeButton } from "./schedule-home-button";
import type { SortKey, SortDir } from "@/lib/domain/dashboard";

interface Props {
  filter: DashboardFilter;
  group: GroupMode;
  view: ViewMode;
  year: number;
  sort: SortKey | null;
  dir: SortDir;
  resultCount: number;
  hqNameById: Record<string, string>;
}

interface Chip {
  label: string;
  clearHref: string;
}

/** 활성 필터 칩 + 결과 건수 + 뷰 토글(카드/표) + 그룹토글/연도이동 (D-019 / D-021) */
export function FilterControls({
  filter,
  group,
  view,
  year,
  sort,
  dir,
  resultCount,
  hqNameById,
}: Props) {
  const state = { filter, group, view, year, sort, dir };
  const chips: Chip[] = [];

  if (filter.lifecycle) {
    chips.push({
      label: LIFECYCLE_LABEL[filter.lifecycle],
      clearHref: dashboardHref(state, { lifecycle: null }),
    });
  }
  if (filter.progress) {
    chips.push({
      label:
        filter.progress === "this_week"
          ? "금주 업데이트"
          : HEALTH_LABEL[filter.progress],
      clearHref: dashboardHref(state, { progress: null }),
    });
  }
  if (filter.headquarterId) {
    chips.push({
      label: hqNameById[filter.headquarterId] ?? "본부",
      clearHref: dashboardHref(state, { headquarterId: null }),
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {chips.length === 0 ? (
          <span className="text-muted-foreground text-sm">필터 없음</span>
        ) : (
          chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.clearHref}
              className="bg-accent hover:bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            >
              {chip.label}
              <span aria-hidden className="text-muted-foreground">
                ✕
              </span>
            </Link>
          ))
        )}
        <span className="text-muted-foreground text-sm">
          → <span className="text-foreground font-semibold">{resultCount}</span>
          건
        </span>
      </div>

      {/* 모든 컨트롤을 한 줄에 — 카드/표 토글 시 세로 위치 고정 */}
      <div className="flex items-center gap-2">
        {view === "card" && (
          <>
            <SortControl state={state} />
            <div className="bg-muted inline-flex rounded-md p-0.5 text-xs font-medium">
              <Tab
                href={dashboardHref(state, { group: "all" })}
                label="전체"
                active={group === "all"}
              />
              <Tab
                href={dashboardHref(state, { group: "mprs" })}
                label="MPRS"
                active={group === "mprs"}
              />
            </div>
          </>
        )}

        {view === "table" && <ScheduleHomeButton />}

        {/* 카드/표 토글 (항상 같은 위치) */}
        <div className="bg-muted inline-flex rounded-md p-0.5 text-xs font-medium">
          <Tab
            href={dashboardHref(state, { view: "card" })}
            label="카드"
            active={view === "card"}
          />
          <Tab
            href={dashboardHref(state, { view: "table" })}
            label="표"
            active={view === "table"}
          />
        </div>
      </div>
    </div>
  );
}

function Tab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "rounded px-3 py-1 transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
