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

function toAttachment(r: RawRow): ProjectAttachment {
  return {
    id: r.id,
    projectId: r.project_id,
    fileName: r.file_name,
    url: routePath(r.storage_path), // 앱 프록시 경로(올바른 Content-Type 서빙)
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

// 확장자 → MIME. 브라우저가 type을 비우거나 generic으로 줄 때 보정용.
// (예: .html을 text/plain으로 올리면 브라우저가 코드를 그대로 표시함 → text/html로 강제)
const EXT_MIME: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  xml: "application/xml",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
};

/**
 * 파일명/경로 → Content-Type. 확장자가 알려진 형식이면 그걸 우선해
 * (브라우저가 .html을 text/plain 등으로 줘도) 올바른 타입으로 서빙되게 한다.
 * 업로드(브라우저 type 폴백)와 서빙 프록시(/attachments)에서 공용.
 */
export function contentTypeForName(name: string, fallback?: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? (fallback || "application/octet-stream");
}

/** 첨부 서빙 라우트 경로 (공개 스토리지를 올바른 Content-Type으로 재서빙) */
function routePath(storagePath: string): string {
  return (
    "/attachments/" +
    storagePath
      .split("/")
      .map(encodeURIComponent)
      .join("/")
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
  return (data ?? []).map((r) => toAttachment(r as RawRow));
}

/** 파일 업로드 → 스토리지 저장 + 메타 행 기록. 실패 시 업로드 객체 롤백. */
export async function uploadProjectAttachment(
  projectId: string,
  file: File,
): Promise<ProjectAttachment> {
  if (!UUID_RE.test(projectId)) throw new Error("잘못된 과제 ID입니다.");
  const supabase = await createClient();
  const path = `${projectId}/${crypto.randomUUID()}-${sanitize(file.name)}`;
  const contentType = contentTypeForName(file.name, file.type);

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType,
      upsert: false,
    });
  if (upErr) throw new Error(`업로드 실패: ${upErr.message}`);

  const { data, error } = await supabase
    .from("project_attachments")
    .insert({
      project_id: projectId,
      file_name: file.name.slice(0, 200),
      storage_path: path,
      mime_type: contentType,
      size_bytes: file.size,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]); // 롤백
    throw new Error(`첨부 저장 실패: ${error?.message ?? "알 수 없는 오류"}`);
  }
  return toAttachment(data as RawRow);
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
