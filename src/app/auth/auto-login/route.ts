import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * ⚠️ 임시 자동 로그인 라우트.
 * 미인증 접속 시 service role(admin)로 고정 계정의 매직링크 토큰을 발급하고
 * verifyOtp로 세션 쿠키를 심어 자동 로그인시킨다. (실제 로그인 UI 없이 접속 허용)
 *
 * 인증 복구 시: 이 라우트 삭제 + middleware.ts 리다이렉트를 '/login'으로 되돌릴 것.
 */
const AUTO_LOGIN_EMAIL = 'minsu.yeo@sk.com';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') || '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    // 1) admin으로 고정 계정의 매직링크(해시 토큰) 발급
    const admin = createAdminClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: AUTO_LOGIN_EMAIL,
    });
    const tokenHash = data?.properties?.hashed_token;
    const verifyType = data?.properties?.verification_type;
    if (error || !tokenHash || !verifyType) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // 2) 쿠키 바인딩된 server client로 verifyOtp → 세션 쿠키 설정
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: verifyType as 'magiclink' | 'email',
      token_hash: tokenHash,
    });
    if (verifyError) {
      return NextResponse.redirect(`${origin}/login`);
    }

    return NextResponse.redirect(`${origin}${safeNext}`);
  } catch {
    return NextResponse.redirect(`${origin}/login`);
  }
}
