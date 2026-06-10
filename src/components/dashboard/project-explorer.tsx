import Link from "next/link";

import {
  fetchProjectList,
  fetchHeadquarters,
  fetchProjectDetail,
} from "@/lib/repositories/projects";
import { fetchTags } from "@/lib/repositories/masters";
import { fetchEffectForProject } from "@/lib/repositories/effects";
import { ProjectDetailDrawer } from "@/components/project-detail/project-detail-drawer";
import {
  parseFilter,
  applyFilter,
  computeKpis,
  sortProjectList,
  UNTAGGED,
} from "@/lib/domain/dashboard";
import { performanceSummary } from "@/lib/domain/analytics";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { ProjectTable } from "@/components/dashboard/project-table";
import { PortfolioMap } from "@/components/dashboard/portfolio-map";
import { ScheduleHomeButton } from "@/components/dashboard/schedule-home-button";
import {
  parseSort,
  parseDir,
  parseYear,
  parseMprs,
  dashboardHref,
  type ViewMode,
} from "@/components/dashboard/url";
import { cn } from "@/lib/utils";
import { LIFECYCLE_LABEL, HEALTH_LABEL } from "@/lib/domain/lifecycle";

export interface ExplorerSearchParams {
  lifecycle?: string;
  progress?: string;
  hq?: string;
  view?: string;
  year?: string;
  sort?: string;
  dir?: string;
  mprs?: string;
  tags?: string;
  detail?: string;
}

/**
 * 과제 목록 탐색 섹션 (KPI 드릴다운 + 필터 칩 + 표/맵 + 상세 드로어).
 * `/projects`와 대시보드 홈에서 공유한다. URL 기준 경로는 `base`로 분기 —
 * 같은 페이지 내에서 필터/정렬/뷰/드로어가 일관되게 동작한다.
 */
export async function ProjectExplorer({
  sp,
  base,
  heading = "과제 현황",
  showKpis = true,
  showSummary = true,
}: {
  sp: ExplorerSearchParams;
  base: string;
  heading?: string;
  /** KPI 드릴다운 스트립(과제 단계·헬스·평균 진행률·투자비 집행) 표시 여부 */
  showKpis?: boolean;
  /** 헤더의 요약 카운트(전체/진행중/검토중/완료/운영) 표시 여부 */
  showSummary?: boolean;
}) {
  const [projects, headquarters, tagOptions] = await Promise.all([
    fetchProjectList(),
    fetchHeadquarters(),
    fetchTags(),
  ]);

  const filter = parseFilter(sp);
  const view: ViewMode = sp.view === "map" ? "map" : "table";
  const now = new Date();
  const year = parseYear(sp.year, now.getFullYear());
  const sort = parseSort(sp.sort);
  const dir = parseDir(sp.dir);
  const mprs = parseMprs(sp.mprs);
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const kpis = computeKpis(projects, headquarters, now);
  const perf = performanceSummary(projects);
  const visible = applyFilter(projects, filter, now);
  const sortedItems = sort ? sortProjectList(visible, sort, dir) : visible;

  const state = {
    filter,
    group: "all" as const,
    view,
    year,
    sort,
    dir,
    mprs,
    base,
  };
  const hqNameById = Object.fromEntries(
    headquarters.map((h) => [h.id, h.name]),
  );

  // 상세 드로어 (?detail=<id>)
  const detail = sp.detail ? await fetchProjectDetail(sp.detail) : null;
  const detailEffect = detail ? await fetchEffectForProject(detail.id) : null;
  const closeHref = dashboardHref(state, { detail: null });

  const lc = (k: string) => kpis.lifecycle.find((l) => l.key === k)?.count ?? 0;

  // 활성 필터 칩
  const chips: { label: string; clearHref: string }[] = [];
  if (filter.lifecycle)
    chips.push({
      label: LIFECYCLE_LABEL[filter.lifecycle],
      clearHref: dashboardHref(state, { lifecycle: null }),
    });
  if (filter.progress)
    chips.push({
      label:
        filter.progress === "this_week"
          ? "금주 업데이트"
          : HEALTH_LABEL[filter.progress],
      clearHref: dashboardHref(state, { progress: null }),
    });
  if (filter.headquarterId)
    chips.push({
      label: hqNameById[filter.headquarterId] ?? "본부",
      clearHref: dashboardHref(state, { headquarterId: null }),
    });

  return (
    <section className="flex flex-col gap-4">
      {/* 헤더 — 단독 페이지(KPI 표시)에서만 상단 타이틀.
          홈 임베드(showKpis=false)에서는 아래 과제속성 줄 왼쪽으로 이동. */}
      {showKpis && (
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">{heading}</h2>
          {showSummary && (
            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
              전체 {kpis.total}건 · 진행중 {lc("in_progress")} · 검토중{" "}
              {lc("under_review")} · 완료 {lc("completed")} · 운영{" "}
              {lc("operating")}
            </p>
          )}
        </div>
      )}

      {/* KPI 스트립 */}
      {showKpis && (
        <KpiStrip
          kpis={kpis}
          filter={filter}
          state={state}
          avgProgress={perf.avgProgress}
        />
      )}

      {/* 활성 필터 칩 + 결과 수 */}
      {(chips.length > 0 || view === "table") && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link
              key={c.label}
              href={c.clearHref}
              aria-label={`${c.label} 필터 제거`}
              className="bg-accent hover:bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            >
              {c.label}
              <span aria-hidden className="text-muted-foreground">
                ✕
              </span>
            </Link>
          ))}
          {chips.length >= 2 && (
            <Link
              href={dashboardHref(state, {
                lifecycle: null,
                progress: null,
                headquarterId: null,
              })}
              className="text-muted-foreground hover:text-foreground rounded-full px-2 py-1 text-xs font-medium underline-offset-2 hover:underline"
            >
              전체 해제
            </Link>
          )}
          {chips.length > 0 && (
            <span className="text-muted-foreground text-sm">
              →{" "}
              <span className="text-foreground font-semibold">
                {visible.length}
              </span>
              건
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {/* 좌: (홈) 타이틀 + 과제 속성(태그) 필터 — 복수 선택 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {!showKpis && (
            <h2 className="text-[15px] font-extrabold tracking-tight">
              {heading}
            </h2>
          )}
          {tagOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-foreground mr-1 text-[12.5px] font-bold">
                과제속성
              </span>
              {tagOptions.map((t) => {
                const active = filter.tags.includes(t.name);
                const next = active
                  ? filter.tags.filter((x) => x !== t.name)
                  : [...filter.tags, t.name];
                return (
                  <Link
                    key={t.id}
                    href={dashboardHref(state, { tags: next })}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold transition-all",
                      active
                        ? "border-navy bg-navy text-white shadow-sm"
                        : "border-border-strong text-muted-foreground hover:border-navy/40 hover:text-foreground bg-card hover:bg-muted",
                    )}
                  >
                    {active && (
                      <span className="text-[10px] leading-none">✓</span>
                    )}
                    {t.name}
                  </Link>
                );
              })}
              {/* 기타 — 태그가 없는 과제 */}
              {(() => {
                const active = filter.tags.includes(UNTAGGED);
                const next = active
                  ? filter.tags.filter((x) => x !== UNTAGGED)
                  : [...filter.tags, UNTAGGED];
                return (
                  <Link
                    href={dashboardHref(state, { tags: next })}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold transition-all",
                      active
                        ? "border-navy bg-navy text-white shadow-sm"
                        : "border-border-strong text-muted-foreground hover:border-navy/40 hover:text-foreground bg-card hover:bg-muted",
                    )}
                  >
                    {active && (
                      <span className="text-[10px] leading-none">✓</span>
                    )}
                    기타
                  </Link>
                );
              })()}
            </div>
          )}
        </div>

        {/* 우: 드래그 안내 · 현재 · 표/맵 */}
        <div className="flex shrink-0 items-center gap-2">
          {view === "table" && (
            <span className="text-muted-foreground hidden text-[11px] lg:inline">
              타임라인을 드래그하거나 ←/→ 키로 기간 이동
            </span>
          )}
          {view === "table" && <ScheduleHomeButton />}
          <div className="bg-card inline-flex gap-1 rounded-xl border p-1 text-[12.5px] font-semibold">
            <ViewTab
              href={dashboardHref(state, { view: "table" })}
              label="표"
              active={view === "table"}
            />
            <ViewTab
              href={dashboardHref(state, { view: "map" })}
              label="맵"
              active={view === "map"}
            />
          </div>
        </div>
      </div>
      {view === "table" ? (
        <ProjectTable items={sortedItems} state={state} todayISO={todayISO} />
      ) : (
        <PortfolioMap items={visible} state={state} />
      )}

      {detail && (
        <ProjectDetailDrawer
          detail={detail}
          effect={detailEffect}
          closeHref={closeHref}
          todayISO={todayISO}
        />
      )}
    </section>
  );
}

function ViewTab({
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
        "rounded-lg px-3.5 py-1 transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
