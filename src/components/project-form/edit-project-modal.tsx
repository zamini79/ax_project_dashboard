"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { ProjectForm } from "./project-form";
import { loadProjectEditData } from "@/app/projects/actions";

type EditData = Awaited<ReturnType<typeof loadProjectEditData>>;

/**
 * 과제 편집 전체 모달. 현재 화면(드로어·상세) 위에 폼을 띄우고,
 * 저장 완료 시 모달만 닫아 배경으로 복귀 + 갱신.
 */
export function EditProjectModal({
  projectId,
  className,
  label = "편집",
}: {
  projectId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<EditData>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function openModal() {
    setOpen(true);
    setData(null);
    loadProjectEditData(projectId).then(setData);
  }
  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={openModal} className={className}>
        {label}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,24,48,.45)",
              zIndex: 140,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              overflowY: "auto",
              padding: "32px 16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-background w-full max-w-[1040px] rounded-2xl shadow-2xl"
            >
              <div className="bg-card sticky top-0 z-[2] flex items-center justify-between rounded-t-2xl border-b px-6 py-4">
                <h1 className="text-xl font-semibold">과제 편집</h1>
                <button
                  type="button"
                  onClick={close}
                  aria-label="닫기"
                  className="text-muted-foreground hover:bg-muted flex h-8 w-8 items-center justify-center rounded-lg border"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                {data ? (
                  <ProjectForm
                    mode="edit"
                    projectId={projectId}
                    defaultValues={data.values}
                    headquarters={data.options.headquarters}
                    departments={data.options.departments}
                    people={data.options.people}
                    aiTechs={data.options.aiTechs}
                    planItems={data.options.planItems}
                    onCancel={close}
                    onSuccess={() => {
                      close();
                      router.refresh();
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground py-10 text-center text-sm">
                    불러오는 중…
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
