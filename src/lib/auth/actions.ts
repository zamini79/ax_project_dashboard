'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * 로그아웃. 폼 action이나 서버 액션으로 호출.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * 현재 로그인된 사용자의 auth 정보 + people 레코드를 함께 반환.
 * people에 매칭 row가 없으면 person은 null (첫 로그인 후 등록 전 상태).
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: person } = await supabase
    .from('people')
    .select('id, name, email, role, department_id')
    .eq('email', user.email!)
    .maybeSingle();

  return { authUser: user, person };
}
