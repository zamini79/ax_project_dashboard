import Link from "next/link";
import { notFound } from "next/navigation";

import {
  fetchHeadquarters,
  fetchProjectEditData,
} from "@/lib/repositories/projects";
import {
  fetchDepartments,
  fetchPeople,
  fetchAiTechs,
} from "@/lib/repositories/masters";
import { wonToEok, type ProjectFormValues } from "@/lib/domain/project-form";
import { ProjectForm } from "@/components/project-form/project-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProjectPage({ params }: { params: Params }) {
  const { id } = await params;

  const [edit, headquarters, departments, people, aiTechs] = await Promise.all([
    fetchProjectEditData(id),
    fetchHeadquarters(),
    fetchDepartments(),
    fetchPeople(),
    fetchAiTechs(),
  ]);

  if (!edit) notFound();

  const defaultValues: ProjectFormValues = {
    name: edit.name,
    description: edit.description ?? "",
    mprs: edit.mprs,
    headquarterId: edit.headquarter_id,
    lifecycle: edit.lifecycle,
    health: edit.health,
    startDate: edit.start_date ?? "",
    endDate: edit.end_date ?? "",
    budgetEok: wonToEok(edit.total_budget),
    fte: edit.fte ?? undefined,
    progressPct: edit.progress_pct,
    pmIds: edit.pmIds,
    departmentIds: edit.departmentIds,
    aiTechIds: edit.aiTechIds,
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-card border-b px-6 py-4">
        <nav className="text-muted-foreground mb-2 text-xs">
          <Link
            href="/projects"
            className="hover:text-foreground transition-colors"
          >
            과제 현황
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            href={`/projects/${edit.id}`}
            className="hover:text-foreground transition-colors"
          >
            과제 상세
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">편집</span>
        </nav>
        <h1 className="truncate text-xl font-semibold">{edit.name} · 편집</h1>
      </header>

      <main className="mx-auto w-full max-w-[1040px] flex-1 px-6 py-5">
        <ProjectForm
          mode="edit"
          projectId={edit.id}
          defaultValues={defaultValues}
          headquarters={headquarters}
          departments={departments}
          people={people}
          aiTechs={aiTechs}
        />
      </main>
    </div>
  );
}
