"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/actions";
import { createManualUpdate } from "@/lib/repositories/project-updates";

export interface UpdateFormState {
  ok: boolean;
  error?: string;
  /** 성공할 때마다 갱신되는 토큰 — 클라이언트가 새 성공을 감지해 모달을 닫는 용도 */
  token?: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 수동 업데이트 작성 서버 액션.
 * 인증 확인 → 작성자(people) 해석 → repository 작성 → 상세 페이지 revalidate.
 */
export async function createUpdateAction(
  _prevState: UpdateFormState,
  formData: FormData,
): Promise<UpdateFormState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const updateDate = String(formData.get("updateDate") ?? "").trim();

  if (!projectId) return { ok: false, error: "잘못된 요청입니다." };
  if (!content) return { ok: false, error: "내용을 입력하세요." };
  if (!DATE_RE.test(updateDate)) {
    return { ok: false, error: "날짜 형식이 올바르지 않습니다." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  try {
    await createManualUpdate({
      projectId,
      content,
      updateDate,
      authorId: user.person?.id ?? null,
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "업데이트 작성에 실패했습니다.",
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects"); // 목록/드로어(?detail=) 갱신
  return { ok: true, token: Date.now() };
}
