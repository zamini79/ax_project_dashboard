'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 메일의 링크를 클릭하면 이 콜백으로 돌아옴
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // true(기본)면 신규 이메일도 자동 가입됨. 사내 화이트리스트가 필요하면 false로.
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-neutral-900">AX 과제 대시보드</h1>
          <p className="mt-1 text-sm text-neutral-500">AX추진실</p>
        </div>

        {status === 'sent' ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-medium">메일을 확인하세요</p>
            <p className="mt-1 text-emerald-700">
              {email} 로 로그인 링크를 보냈습니다. 메일의 링크를 클릭하면 로그인됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-neutral-600">
                사내 이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-600">{errorMsg || '오류가 발생했습니다.'}</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {status === 'sending' ? '발송 중…' : '로그인 링크 받기'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
