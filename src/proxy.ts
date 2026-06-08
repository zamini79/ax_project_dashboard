import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * 루트 가드 (Next.js 16 — middleware.ts 대신 proxy.ts 컨벤션).
 * 매 요청마다 세션 토큰을 갱신하고 미인증 사용자를 자동 로그인(/auth/auto-login)으로 보낸다.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에서 실행:
     * - _next/static, _next/image (정적 자원)
     * - favicon.ico
     * - 이미지/폰트 확장자
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
