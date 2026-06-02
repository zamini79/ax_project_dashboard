import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 매직링크 클릭 시 도착하는 콜백.
 * URL의 ?code=... 를 세션으로 교환한다 (PKCE flow).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 로그인 후 돌아갈 곳 (없으면 홈)
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 코드가 없거나 교환 실패
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
