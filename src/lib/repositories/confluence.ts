import "server-only";

/**
 * Confluence(주간보고) 동기화 — 격리된 외부 연동 계층 (D-014).
 *
 * ⚠️ 현재 상태(2026-07): 사내 Atlassian(skbios.atlassian.net)이 IP allowlist
 * 정책으로 승인된 IP에서만 REST API 접근을 허용한다. 개인 토큰 인증 자체는
 * 통과하지만(401 아님), 미승인 IP는 403으로 차단된다. 따라서 대시보드가
 * 사내 시스템(고정 IP)으로 이관되기 전까지는 동기화를 비활성으로 둔다.
 *
 * 이관 후 활성화 절차:
 *   1. 서버 IP를 Atlassian Org의 IP allowlist에 등록
 *   2. 환경변수 CONFLUENCE_SYNC_ENABLED=true 설정
 *      (+ ATLASSIAN_SITE_URL / ATLASSIAN_EMAIL / ATLASSIAN_API_TOKEN)
 *   3. runConfluenceSync()의 TODO 파이프라인 구현 (아래 참조)
 */

export type SyncStatus = "disabled" | "not_implemented" | "synced" | "error";

export interface SyncResult {
  ok: boolean;
  status: SyncStatus;
  /** 사용자에게 그대로 보여줄 한국어 안내/결과 메시지 */
  message: string;
  /** 동기화로 새로 반영된 업데이트 건수 (synced일 때) */
  inserted?: number;
}

/** 동기화 활성 여부 — 사내 이관 후 env로 켠다. 기본 비활성. */
export function isConfluenceSyncEnabled(): boolean {
  return process.env.CONFLUENCE_SYNC_ENABLED === "true";
}

/** Atlassian 인증 정보가 모두 설정됐는지 (값 노출 없이 존재만 확인) */
export function isConfluenceConfigured(): boolean {
  return Boolean(
    process.env.ATLASSIAN_SITE_URL &&
      process.env.ATLASSIAN_EMAIL &&
      process.env.ATLASSIAN_API_TOKEN,
  );
}

const DISABLED_MESSAGE =
  "Confluence 주간보고 자동 동기화는 사내 시스템 환경에서만 동작합니다. " +
  "현재는 회사 Atlassian의 IP 접근 정책(IP allowlist)으로 외부에서 호출할 수 없어, " +
  "대시보드가 사내 환경으로 이관된 뒤 활성화됩니다.";

/**
 * 주간보고 동기화 실행.
 * - 비활성(현재 기본): 안내 메시지 반환, 아무 작업도 하지 않음.
 * - 활성(사내 이관 후): 아래 TODO 파이프라인 구동.
 */
export async function runConfluenceSync(): Promise<SyncResult> {
  if (!isConfluenceSyncEnabled()) {
    return { ok: false, status: "disabled", message: DISABLED_MESSAGE };
  }

  if (!isConfluenceConfigured()) {
    return {
      ok: false,
      status: "error",
      message:
        "동기화가 활성화됐으나 Atlassian 접속 정보(ATLASSIAN_SITE_URL/EMAIL/API_TOKEN)가 " +
        "설정되지 않았습니다. 환경변수를 확인하세요.",
    };
  }

  // TODO(Phase 2 · 사내 이관 후): 실제 동기화 파이프라인 (docs/planning.md §6, D-011~013)
  //   1. [Discovery] project_confluence_pages의 루트 페이지 → 자식 페이지 트리 탐색
  //        confluenceFetch(`/wiki/rest/api/content/{id}/child/page`)
  //   2. [Version]  각 페이지 version.number를 저장값과 비교 → 변경분만 처리 (중복 방지)
  //   3. [Adapter]  classification_rules로 page_role 판정 (못 잡으면 'other'/'unclassified')
  //   4. [Store]    본문(body.storage)을 project_updates에 INSERT(source='atlassian'),
  //                 project_confluence_pages 갱신, projects.last_synced_at = now()
  //        ※ Confluence 호출은 순차 + 100ms 지연 (D-011)
  //   구현 후 아래 throw를 제거하고 { ok:true, status:'synced', inserted } 반환.
  return {
    ok: false,
    status: "not_implemented",
    message:
      "동기화가 활성화됐으나 수집 파이프라인이 아직 구현되지 않았습니다. " +
      "runConfluenceSync()의 TODO를 구현하세요.",
  };
}

/**
 * Confluence Cloud REST 호출 헬퍼 (사내 이관 후 파이프라인에서 사용).
 * 인증 방식은 로컬에서 검증됨(Basic email:token) — IP allowlist만 통과하면 동작한다.
 */
export async function confluenceFetch<T = unknown>(path: string): Promise<T> {
  const site = process.env.ATLASSIAN_SITE_URL?.replace(/\/$/, "");
  const email = process.env.ATLASSIAN_EMAIL;
  const token = process.env.ATLASSIAN_API_TOKEN;
  if (!site || !email || !token) {
    throw new Error("Atlassian 접속 정보가 설정되지 않았습니다.");
  }
  const auth = "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
  const res = await fetch(site + path, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `Confluence 요청 실패 (${res.status}): ${path} — ${(await res.text()).slice(0, 200)}`,
    );
  }
  return res.json() as Promise<T>;
}
