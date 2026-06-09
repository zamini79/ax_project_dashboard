"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { ProjectForm } from "./project-form";
import { emptyFormValues } from "@/lib/domain/project-form";
import { loadProjectFormOptions } from "@/app/projects/actions";

type Options = Awaited<ReturnType<typeof loadProjectFormOptions>>;

/**
 * "새 과제" 전체 모달. 현재 화면 위에 폼을 띄우고, 저장 완료 시 모달만 닫아
 * 배경(이전 화면)으로 복귀 + 갱신. (상단 내비 없는 단독 페이지로 빠지지 않음)
 */
export function NewProjectModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Options | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function openModal() {
    setOpen(true);
    if (!opts) loadProjectFormOptions().then(setOpts);
  }
  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-[9px] px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
      >
        <Plus size={15} />새 과제
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
              zIndex: 130,
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
                <h1 className="text-xl font-semibold">새 과제 등록</h1>
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
                {opts ? (
                  <ProjectForm
                    mode="create"
                    defaultValues={emptyFormValues()}
                    headquarters={opts.headquarters}
                    departments={opts.departments}
                    people={opts.people}
                    aiTechs={opts.aiTechs}
                    planItems={opts.planItems}
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
