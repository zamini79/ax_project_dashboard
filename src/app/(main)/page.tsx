import {
  fetchProjectList,
  fetchHeadquarters,
} from "@/lib/repositories/projects";
import {
  parseFilter,
  applyFilter,
  computeKpis,
  sortProjectList,
} from "@/lib/domain/dashboard";
import { KpiSection } from "@/components/dashboard/kpi-section";
import { FilterControls } from "@/components/dashboard/filter-controls";
import { ProjectGrid } from "@/components/dashboard/project-grid";
import { ProjectTable } from "@/components/dashboard/project-table";
import {
  parseGroup,
  parseView,
  parseYear,
  parseSort,
  parseDir,
} from "@/components/dashboard/url";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  lifecycle?: string;
  progress?: string;
  hq?: string;
  group?: string;
  view?: string;
  year?: string;
  sort?: string;
  dir?: string;
}>;

export default async function DashboardHome({
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
  const group = parseGroup(sp.group);
  const view = parseView(sp.view);
  const now = new Date();
  const year = parseYear(sp.year, now.getFullYear());
  const sort = parseSort(sp.sort);
  const dir = parseDir(sp.dir);
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const kpis = computeKpis(projects, headquarters, now);
  const visible = applyFilter(projects, filter, now);
  // 정렬 컬럼이 지정되면 재정렬(카드·표 공통), 아니면 디폴트 정렬(D-020) 유지
  const sortedItems = sort ? sortProjectList(visible, sort, dir) : visible;

  const state = { filter, group, view, year, sort, dir };

  const hqNameById = Object.fromEntries(
    headquarters.map((h) => [h.id, h.name]),
  );

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-6 py-5">
      <KpiSection
        kpis={kpis}
        filter={filter}
        group={group}
        view={view}
        year={year}
        sort={sort}
        dir={dir}
      />

      <FilterControls
        filter={filter}
        group={group}
        view={view}
        year={year}
        sort={sort}
        dir={dir}
        resultCount={visible.length}
        hqNameById={hqNameById}
      />

      {view === "table" ? (
        <ProjectTable items={sortedItems} state={state} todayISO={todayISO} />
      ) : (
        <ProjectGrid items={sortedItems} group={group} />
      )}
    </main>
  );
}
