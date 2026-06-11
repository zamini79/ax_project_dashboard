"use client";

import { useState, useRef } from "react";
import { createPortal, useFormStatus } from "react-dom";

import { UnsavedConfirm } from "@/components/project-form/unsaved-confirm";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUpdateAction } from "@/app/projects/[id]/actions";

/** "+ 업데이트 작성" 버튼 + 모달 (§7.1). 성공 시 모달 닫고 타임라인 자동 갱신(revalidate). */
export function UpdateCompose({
  projectId,
  defaultDate,
}: {
  projectId: string;
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [confirm, setConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // 작성/수정된 내용이 있는지 (날짜 변경 or 내용 입력)
  function isDirty(): boolean {
    const f = formRef.current;
    if (!f) return false;
    const content =
      (f.elements.namedItem("content") as HTMLTextAreaElement | null)?.value ??
      "";
    const date =
      (f.elements.namedItem("updateDate") as HTMLInputElement | null)?.value ??
      "";
    return content.trim() !== "" || date !== defaultDate;
  }

  // form action: 서버 액션 호출 → 성공 시 닫기 (effect 아닌 이벤트 컨텍스트)
  async function onSubmit(formData: FormData) {
    const result = await createUpdateAction({ ok: false }, formData);
    if (result.ok) {
      setError(undefined);
      setConfirm(false);
      setOpen(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(undefined);
          setConfirm(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          + 업데이트 작성
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => {
          // 확인창이 떠 있으면 그쪽이 처리. 입력 내용 있으면 저장 여부 확인.
          if (confirm) {
            e.preventDefault();
            return;
          }
          if (isDirty()) {
            e.preventDefault();
            setConfirm(true);
          }
        }}
        onPointerDownOutside={(e) => {
          // 팝업 밖에서 '눌러서 시작한' 클릭만 처리. (안에서 드래그→밖에서 떼기는 무시)
          if (confirm) {
            e.preventDefault();
            return;
          }
          if (isDirty()) {
            e.preventDefault();
            setConfirm(true);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>업데이트 작성</DialogTitle>
          <DialogDescription>
            과제 진행 상황을 수동으로 기록합니다.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="updateDate">날짜</Label>
            <Input
              id="updateDate"
              name="updateDate"
              type="date"
              defaultValue={defaultDate}
              required
              className="w-44"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              name="content"
              required
              rows={5}
              placeholder="예: 검출 모델 재학습 완료, 오탐률 12%→7%"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                취소
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>

      {confirm &&
        createPortal(
          <UnsavedConfirm
            onSave={() => {
              setConfirm(false);
              formRef.current?.requestSubmit();
            }}
            onDiscard={() => {
              setConfirm(false);
              setError(undefined);
              setOpen(false);
            }}
            onCancel={() => setConfirm(false)}
          />,
          document.body,
        )}
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </Button>
  );
}
