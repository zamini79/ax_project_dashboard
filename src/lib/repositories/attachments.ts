import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * 과제 첨부파일 저장소 (D-014: Supabase Storage 접근은 여기에만 격리).
 * 공개 버킷이라 getPublicUrl로 영구 공개 링크를 만든다.
 */

const BUCKET = "project-attachments";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ProjectAttachment {
  id: string;
  projectId: string;
  fileName: string;
  url: string; // 공개 URL (복사·공유용)
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

interface RawRow {
  id: string;
  project_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const SELECT =
  "id, project_id, file_name, storage_path, mime_type, size_bytes, created_at";

type DbClient = Awaited<ReturnType<typeof createClient>>;

function toAttachment(supabase: DbClient, r: RawRow): ProjectAttachment {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(r.storage_path);
  return {
    id: r.id,
    projectId: r.project_id,
    fileName: r.file_name,
    url: data.publicUrl,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at,
  };
}

/** 파일명 → 경로 안전 문자열 (구분자·공백 정리, 길이 제한) */
function sanitize(name: string): string {
  return (
    name
      .replace(/[/\\]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "file"
  );
}

/** 과제 첨부 목록 (최신순) */
export async function fetchProjectAttachments(
  projectId: string,
): Promise<ProjectAttachment[]> {
  if (!UUID_RE.test(projectId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_attachments")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`첨부파일 조회 실패: ${error.message}`);
  return (data ?? []).map((r) => toAttachment(supabase, r as RawRow));
}

/** 파일 업로드 → 스토리지 저장 + 메타 행 기록. 실패 시 업로드 객체 롤백. */
export async function uploadProjectAttachment(
  projectId: string,
  file: File,
): Promise<ProjectAttachment> {
  if (!UUID_RE.test(projectId)) throw new Error("잘못된 과제 ID입니다.");
  const supabase = await createClient();
  const path = `${projectId}/${crypto.randomUUID()}-${sanitize(file.name)}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(`업로드 실패: ${upErr.message}`);

  const { data, error } = await supabase
    .from("project_attachments")
    .insert({
      project_id: projectId,
      file_name: file.name.slice(0, 200),
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]); // 롤백
    throw new Error(`첨부 저장 실패: ${error?.message ?? "알 수 없는 오류"}`);
  }
  return toAttachment(supabase, data as RawRow);
}

/** 첨부 삭제 (스토리지 객체 + 메타 행) */
export async function deleteProjectAttachment(id: string): Promise<void> {
  if (!UUID_RE.test(id)) throw new Error("잘못된 첨부 ID입니다.");
  const supabase = await createClient();
  const { data: row, error: selErr } = await supabase
    .from("project_attachments")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw new Error(`첨부 조회 실패: ${selErr.message}`);
  if (!row) return;

  await supabase.storage.from(BUCKET).remove([row.storage_path]);
  const { error } = await supabase
    .from("project_attachments")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`첨부 삭제 실패: ${error.message}`);
}
