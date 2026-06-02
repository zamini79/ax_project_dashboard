import "server-only";

import { createClient } from "@/lib/supabase/server";

/** 수동 업데이트 작성 입력 */
export interface CreateManualUpdateInput {
  projectId: string;
  content: string;
  updateDate: string; // YYYY-MM-DD
  authorId: string | null;
}

/**
 * 수동 업데이트 1건 작성 (source='manual').
 * ★ Supabase 호출은 repositories/ 에만 (D-014). RLS는 인증 세션으로 통과.
 */
export async function createManualUpdate(
  input: CreateManualUpdateInput,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("project_updates").insert({
    project_id: input.projectId,
    content: input.content,
    update_date: input.updateDate,
    author_id: input.authorId,
    source: "manual",
  });

  if (error) {
    throw new Error(`업데이트 작성 실패: ${error.message}`);
  }
}
