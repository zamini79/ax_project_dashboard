"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

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

  // form action: 서버 액션 호출 → 성공 시 닫기 (effect 아닌 이벤트 컨텍스트)
  async function onSubmit(formData: FormData) {
    const result = await createUpdateAction({ ok: false }, formData);
    if (result.ok) {
      setError(undefined);
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
        if (!next) setError(undefined);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          + 업데이트 작성
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>업데이트 작성</DialogTitle>
          <DialogDescription>
            과제 진행 상황을 수동으로 기록합니다.
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="flex flex-col gap-4">
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
