import {
  ProjectExplorer,
  type ExplorerSearchParams,
} from "@/components/dashboard/project-explorer";

export const dynamic = "force-dynamic";

type SearchParams = Promise<ExplorerSearchParams>;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 px-6 py-5">
      <ProjectExplorer sp={sp} base="/projects" heading="과제 현황" />
    </main>
  );
}
