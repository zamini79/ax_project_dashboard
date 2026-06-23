import { contentTypeForName } from "@/lib/repositories/attachments";

/**
 * 첨부파일 공개 서빙 프록시.
 * Supabase Storage는 HTML/SVG 등을 보안상 text/plain(+nosniff)으로 강제 서빙해
 * 브라우저에서 코드가 그대로 노출된다. 여기서 공개 객체를 받아 확장자 기준
 * 올바른 Content-Type으로 다시 내보내 정상 렌더링되게 한다. (로그인 불필요 — 공개 링크)
 *
 * 보안: 업로드 HTML이 앱 오리진 쿠키에 접근하지 못하도록 CSP sandbox 적용.
 */
export const dynamic = "force-dynamic";

const BUCKET = "project-attachments";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path?.length) return new Response("Not found", { status: 404 });

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return new Response("Server misconfigured", { status: 500 });

  // params는 디코딩된 세그먼트 → 스토리지 요청용으로 재인코딩
  const encoded = path.map(encodeURIComponent).join("/");
  const storageUrl = `${base}/storage/v1/object/public/${BUCKET}/${encoded}`;

  const upstream = await fetch(storageUrl);
  if (!upstream.ok) {
    return new Response("Not found", { status: 404 });
  }

  const body = await upstream.arrayBuffer();
  const fileName = path[path.length - 1] ?? "file";
  const contentType = contentTypeForName(fileName);

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=300",
      // 업로드 콘텐츠를 앱 오리진과 격리(쿠키/세션 접근 차단)
      "Content-Security-Policy": "sandbox allow-scripts allow-popups allow-forms",
    },
  });
}
