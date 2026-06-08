import { NextResponse } from 'next/server';
// import { updateSession } from '@/lib/supabase/middleware';

/**
 * 루트 가드 (Next.js 16 — middleware.ts 대신 proxy.ts 컨벤션).
 *
 * ⚠️ 임시: 로그인 가드 비활성화 — 로그인 없이 전체 접속 허용.
 * 인증 복구 시 아래 pass-through를 제거하고 `return await updateSession(request)` 로 되돌릴 것.
 */
export async function proxy() {
  return NextResponse.next();
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
