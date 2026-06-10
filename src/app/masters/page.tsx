import Link from "next/link";

import { fetchHeadquarters } from "@/lib/repositories/projects";
import {
  fetchDepartmentsAdmin,
  fetchPeopleAdmin,
  fetchAiTechs,
  fetchTags,
} from "@/lib/repositories/masters";
import { EntityManager } from "@/components/masters/entity-manager";
import { POSITIONS } from "@/lib/domain/people";
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
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "@/app/masters/actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "hq", label: "본부" },
  { key: "dept", label: "부서" },
  { key: "people", label: "사람" },
  { key: "tech", label: "AI기술" },
  { key: "tag", label: "속성" },
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

  const [headquarters, departments, people, aiTechs, tags] = await Promise.all([
    fetchHeadquarters(),
    fetchDepartmentsAdmin(),
    fetchPeopleAdmin(),
    fetchAiTechs(),
    fetchTags(),
  ]);

  const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }));
  const counts: Record<TabKey, number> = {
    hq: headquarters.length,
    dept: departments.length,
    people: people.length,
    tech: aiTechs.length,
    tag: tags.length,
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-card border-b px-6 py-4">
        <nav className="text-muted-foreground text-xs">
          <Link href="/" className="hover:text-foreground transition-colors">
            대시보드
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">마스터 관리</span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-5">
        <h1 className="text-xl font-extrabold tracking-tight">마스터 관리</h1>
        <p className="text-muted-foreground mb-4 mt-0.5 text-[12.5px]">
          본부 · 부서 · 사람 · AI기술 · 속성 기준정보를 추가·수정·삭제합니다.
        </p>

        {/* 탭 필 */}
        <div className="bg-card mb-4 inline-flex w-fit gap-1 rounded-xl border p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/masters?tab=${t.key}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                active === t.key
                  ? "bg-navy text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "text-[11px] font-bold",
                  active === t.key ? "text-white/70" : "text-faint",
                )}
              >
                {counts[t.key]}
              </span>
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
              position: p.position,
            }))}
            createAction={createPersonAction}
            updateAction={updatePersonAction}
            deleteAction={deletePersonAction}
            nameLabel="이름"
            hasEmail
            relation={{ label: "소속 부서", options: deptOptions }}
            choice={{ label: "직책", options: POSITIONS }}
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

        {active === "tag" && (
          <EntityManager
            items={tags.map((t) => ({ id: t.id, name: t.name }))}
            createAction={createTagAction}
            updateAction={updateTagAction}
            deleteAction={deleteTagAction}
            nameLabel="속성명"
            namePlaceholder="예: Top-down"
          />
        )}
      </main>
    </div>
  );
}
