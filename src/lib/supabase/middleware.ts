import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';

/**
 * 미들웨어에서 호출. 매 요청마다 세션 토큰을 갱신하고,
 * 미인증 사용자를 /login 으로 보낸다.
 *
 * 중요: getUser()를 반드시 호출해야 토큰이 갱신됨. getSession()만으로는 부족.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser()가 토큰을 갱신한다. 이 줄과 createServerClient 사이에 다른 로직을 넣지 말 것.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미인증 + 보호 라우트 → 로그인으로
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth');

  if (!user && !isAuthRoute) {
    // ⚠️ 임시: 미인증 접속 시 로그인 화면 대신 자동 로그인 라우트로.
    //    인증 복구(자동 로그인 제거) 시 pathname을 '/login'으로 되돌릴 것.
    const url = request.nextUrl.clone();
    const dest = url.pathname + url.search;
    url.pathname = '/auth/auto-login';
    url.search = '';
    url.searchParams.set('next', dest);
    return NextResponse.redirect(url);
  }

  // 이미 로그인 상태인데 /login 접근 → 홈으로
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}