"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { archiveProjectAction } from "@/app/projects/actions";

/**
 * 과제 삭제(보관) 버튼 — critical 작업이라 2단계 확인.
 * 1차: 삭제 의사 확인 → 2차: 과제명 확인 후 최종 삭제.
 * 성공 시 onDeleted()(모달: 닫기) 또는 /projects 이동. 배경은 refresh.
 */
export function DeleteProjectButton({
  projectId,
  projectName,
  onDeleted,
}: {
  projectId: string;
  projectName: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=닫힘, 1=1차, 2=2차
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  function close() {
    if (busy) return;
    setStep(0);
    setError(undefined);
  }

  async function confirmDelete() {
    setBusy(true);
    setError(undefined);
    const res = await archiveProjectAction(projectId);
    if ("error" in res) {
      setBusy(false);
      setError(res.error);
      return;
    }
    setBusy(false);
    setStep(0);
    if (onDeleted) onDeleted();
    else router.push("/projects");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep(1)}
        className="rounded-[10px] border border-red-200 px-[18px] py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        과제 삭제
      </button>

      {step > 0 &&
        createPortal(
          <div
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,24,48,.5)",
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-background w-full max-w-[420px] rounded-2xl p-5 shadow-2xl"
            >
              {step === 1 ? (
                <>
                  <h3 className="text-[15px] font-bold">과제 삭제</h3>
                  <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
                    <b className="text-foreground">{projectName}</b> 과제를
                    삭제하면 목록·대시보드·투자비 등 모든 화면에서 사라집니다.
                    계속할까요?
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className="border-border-strong text-muted-foreground hover:bg-muted rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                    >
                      삭제
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-[15px] font-bold text-red-600">
                    한 번 더 확인합니다
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
                    정말 <b className="text-foreground">{projectName}</b> 과제를
                    삭제하시겠습니까? 이 작업은 관리자만 되돌릴 수 있습니다.
                  </p>
                  {error && (
                    <p className="mt-2 text-[13px] text-red-600">{error}</p>
                  )}
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      disabled={busy}
                      className="border-border-strong text-muted-foreground hover:bg-muted rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={busy}
                      className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {busy ? "삭제 중…" : "삭제 확정"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
