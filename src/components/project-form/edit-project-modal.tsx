"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { ProjectForm } from "./project-form";
import { loadProjectEditData } from "@/app/projects/actions";
import { UnsavedConfirm } from "./unsaved-confirm";

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
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const formId = `edit-project-form-${projectId}`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function openModal() {
    setOpen(true);
    setDirty(false);
    setConfirming(false);
    setData(null);
    loadProjectEditData(projectId).then(setData);
  }
  function close() {
    setOpen(false);
    setDirty(false);
    setConfirming(false);
  }
  // 팝업 밖 클릭: 입력 변경 없으면 바로 닫고, 있으면 저장/저장안함/취소 확인
  function requestClose() {
    if (!dirty) close();
    else setConfirming(true);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!dirty) close();
      else setConfirming(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dirty]);

  return (
    <>
      <button type="button" onClick={openModal} className={className}>
        {label}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            onClick={requestClose}
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
              className="bg-background flex max-h-[calc(100vh-64px)] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl shadow-2xl"
            >
              <div className="bg-card flex shrink-0 items-center justify-between border-b px-6 py-4">
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

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {data ? (
                  <ProjectForm
                    mode="edit"
                    projectId={projectId}
                    defaultValues={data.values}
                    headquarters={data.options.headquarters}
                    departments={data.options.departments}
                    people={data.options.people}
                    aiTechs={data.options.aiTechs}
                    tags={data.options.tags}
                    planItems={data.options.planItems}
                    executions={data.executions}
                    attachments={data.attachments}
                    formId={formId}
                    onDirtyChange={setDirty}
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

      {confirming &&
        mounted &&
        createPortal(
          <UnsavedConfirm
            onSave={() => {
              setConfirming(false);
              (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
            }}
            onDiscard={close}
            onCancel={() => setConfirming(false)}
          />,
          document.body,
        )}
    </>
  );
}
