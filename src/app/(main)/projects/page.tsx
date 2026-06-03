import Link from "next/link";

import {
  fetchProjectList,
  fetchHeadquarters,
  fetchProjectDetail,
} from "@/lib/repositories/projects";
import { fetchEffectForProject } from "@/lib/repositories/effects";
import { ProjectDetailDrawer } from "@/components/project-detail/project-detail-drawer";
import {
  parseFilter,
  applyFilter,
  computeKpis,
  sortProjectList,
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

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  lifecycle?: string;
  progress?: string;
  hq?: string;
  view?: string;
  year?: string;
  sort?: string;
  dir?: string;
  mprs?: string;
  detail?: string;
}>;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const [projects, headquarters] = await Promise.all([
    fetchProjectList(),
    fetchHeadquarters(),
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
    base: "/projects",
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
    <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 px-6 py-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">과제 현황</h1>
          <p className="text-muted-foreground mt-0.5 text-[12.5px]">
            전체 {kpis.total}건 · 진행중 {lc("in_progress")} · 검토중{" "}
            {lc("under_review")} · 완료 {lc("completed")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === "table" && (
            <span className="text-muted-foreground hidden text-[11px] lg:inline">
              타임라인을 드래그하거나 ←/→ 키로 기간 이동
            </span>
          )}
          {view === "table" && <ScheduleHomeButton />}
          <div className="bg-card inline-flex gap-1 rounded-xl border p-1 text-[12.5px] font-semibold">
            <ViewTab href={dashboardHref(state, { view: "table" })} label="표" active={view === "table"} />
            <ViewTab href={dashboardHref(state, { view: "map" })} label="맵" active={view === "map"} />
          </div>
        </div>
      </div>

      {/* KPI 스트립 */}
      <KpiStrip
        kpis={kpis}
        filter={filter}
        state={state}
        avgProgress={perf.avgProgress}
      />

      {/* 활성 필터 칩 + 결과 수 */}
      {(chips.length > 0 || view === "table") && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link
              key={c.label}
              href={c.clearHref}
              className="bg-accent hover:bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            >
              {c.label}
              <span aria-hidden className="text-muted-foreground">
                ✕
              </span>
            </Link>
          ))}
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
    </main>
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
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
