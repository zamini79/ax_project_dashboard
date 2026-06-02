import { notFound } from "next/navigation";

import { fetchProjectDetail } from "@/lib/repositories/projects";
import { DetailHeader } from "@/components/project-detail/detail-header";
import { MetaPanel } from "@/components/project-detail/meta-panel";
import {
  UpdateTimeline,
  parseSourceFilter,
} from "@/components/project-detail/update-timeline";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ source?: string }>;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { source } = await searchParams;

  const project = await fetchProjectDetail(id);
  if (!project) notFound();

  const activeSource = parseSourceFilter(source);

  return (
    <div className="flex min-h-full flex-col">
      <DetailHeader project={project} />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-6 py-5 lg:flex-row">
        <MetaPanel project={project} />
        <UpdateTimeline
          projectId={project.id}
          updates={project.updates}
          activeSource={activeSource}
        />
      </main>
    </div>
  );
}
