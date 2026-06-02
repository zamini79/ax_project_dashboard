import Link from "next/link";

import { fetchHeadquarters } from "@/lib/repositories/projects";
import {
  fetchDepartments,
  fetchPeople,
  fetchAiTechs,
} from "@/lib/repositories/masters";
import { emptyFormValues } from "@/lib/domain/project-form";
import { ProjectForm } from "@/components/project-form/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const [headquarters, departments, people, aiTechs] = await Promise.all([
    fetchHeadquarters(),
    fetchDepartments(),
    fetchPeople(),
    fetchAiTechs(),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-card border-b px-6 py-4">
        <nav className="text-muted-foreground mb-2 text-xs">
          <Link href="/" className="hover:text-foreground transition-colors">
            대시보드
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">새 과제</span>
        </nav>
        <h1 className="text-xl font-semibold">새 과제 등록</h1>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-5">
        <ProjectForm
          mode="create"
          defaultValues={emptyFormValues()}
          headquarters={headquarters}
          departments={departments}
          people={people}
          aiTechs={aiTechs}
        />
      </main>
    </div>
  );
}
