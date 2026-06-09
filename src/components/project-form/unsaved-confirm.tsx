"use client";

/**
 * 미저장 변경 확인 다이얼로그 (저장 / 저장하지 않음 / 취소).
 * - 저장: 저장 후 닫기
 * - 저장하지 않음: 저장 없이 닫기
 * - 취소: 원래 입력 상태로 복귀(다이얼로그만 닫고 폼 유지)
 */
export function UnsavedConfirm({
  onSave,
  onDiscard,
  onCancel,
}: {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,24,48,.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background w-full max-w-[380px] rounded-2xl p-5 shadow-2xl"
      >
        <h3 className="text-[15px] font-bold">변경 내용 저장</h3>
        <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
          입력한 내용이 있습니다. 저장하시겠습니까?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border-border-strong text-muted-foreground hover:bg-muted rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="hover:bg-muted rounded-lg border border-transparent px-3.5 py-2 text-[13px] font-semibold text-red-600 transition-colors"
          >
            저장하지 않음
          </button>
          <button
            type="button"
            onClick={onSave}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-[13px] font-bold transition-opacity hover:opacity-90"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
