import Link from "next/link";

import { fetchHeadquarters } from "@/lib/repositories/projects";
import {
  fetchDepartmentsAdmin,
  fetchPeopleAdmin,
  fetchAiTechs,
} from "@/lib/repositories/masters";
import { EntityManager } from "@/components/masters/entity-manager";
import { cn } from "@/lib/utils";
import {
  createHeadquarterAction,
  updateHeadquarterAction,
  deleteHeadquarterAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  createPersonAction,
  updatePersonAction,
  deletePersonAction,
  createAiTechAction,
  updateAiTechAction,
  deleteAiTechAction,
} from "@/app/masters/actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "hq", label: "본부" },
  { key: "dept", label: "부서" },
  { key: "people", label: "사람" },
  { key: "tech", label: "AI기술" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function parseTab(value: string | undefined): TabKey {
  return TABS.some((t) => t.key === value) ? (value as TabKey) : "hq";
}

type SearchParams = Promise<{ tab?: string }>;

export default async function MastersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab } = await searchParams;
  const active = parseTab(tab);

  const [headquarters, departments, people, aiTechs] = await Promise.all([
    fetchHeadquarters(),
    fetchDepartmentsAdmin(),
    fetchPeopleAdmin(),
    fetchAiTechs(),
  ]);

  const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-card border-b px-6 py-4">
        <nav className="text-muted-foreground mb-2 text-xs">
          <Link href="/" className="hover:text-foreground transition-colors">
            대시보드
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">마스터 관리</span>
        </nav>
        <h1 className="text-xl font-semibold">마스터 관리</h1>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-5">
        {/* 탭 */}
        <div className="mb-4 flex gap-1 border-b">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/masters?tab=${t.key}`}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active === t.key
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {active === "hq" && (
          <EntityManager
            items={headquarters.map((h) => ({ id: h.id, name: h.name }))}
            createAction={createHeadquarterAction}
            updateAction={updateHeadquarterAction}
            deleteAction={deleteHeadquarterAction}
            nameLabel="본부명"
            namePlaceholder="예: 전사"
          />
        )}

        {active === "dept" && (
          <EntityManager
            items={departments.map((d) => ({
              id: d.id,
              name: d.name,
              relationId: d.headquarter_id,
            }))}
            createAction={createDepartmentAction}
            updateAction={updateDepartmentAction}
            deleteAction={deleteDepartmentAction}
            nameLabel="부서명"
            relation={{ label: "소속 본부", options: headquarters }}
          />
        )}

        {active === "people" && (
          <EntityManager
            items={people.map((p) => ({
              id: p.id,
              name: p.name,
              email: p.email,
              relationId: p.department_id,
            }))}
            createAction={createPersonAction}
            updateAction={updatePersonAction}
            deleteAction={deletePersonAction}
            nameLabel="이름"
            hasEmail
            relation={{ label: "소속 부서", options: deptOptions }}
          />
        )}

        {active === "tech" && (
          <EntityManager
            items={aiTechs.map((t) => ({ id: t.id, name: t.name }))}
            createAction={createAiTechAction}
            updateAction={updateAiTechAction}
            deleteAction={deleteAiTechAction}
            nameLabel="AI기술명"
            namePlaceholder="예: 멀티모달"
          />
        )}
      </main>
    </div>
  );
}
