"use server";

import { revalidatePath } from "next/cache";

import { runConfluenceSync, type SyncResult } from "@/lib/repositories/confluence";

/**
 * '지금 동기화' 버튼 → Confluence 주간보고 동기화 실행.
 * 현재는 사내 IP 정책으로 비활성(안내 메시지 반환). 이관 후 활성화되면
 * 동기화 성공 시 하이라이트·과제 목록을 갱신한다. (docs/planning.md D-012)
 */
export async function syncConfluenceAction(): Promise<SyncResult> {
  const result = await runConfluenceSync();
  if (result.ok && result.status === "synced") {
    revalidatePath("/highlights");
    revalidatePath("/");
    revalidatePath("/projects");
  }
  return result;
}
