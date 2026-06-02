import Link from "next/link";
import { Search, Building2, Plus } from "lucide-react";

import { getCurrentUser, signOut } from "@/lib/auth/actions";
import { MainTabs } from "@/components/layout/main-tabs";

/** 공용 셸: 상단 플로팅 필 내비 (좌측 사이드바 없음) */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const userLabel =
    currentUser?.person?.name ?? currentUser?.authUser.email ?? null;
  const initial = userLabel?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-background sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3">
        {/* 좌측: 로고 락업 + 필 내비 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="bg-navy flex h-8 w-8 items-center justify-center rounded-[9px] text-sm font-extrabold tracking-tight text-white">
              AX
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[14.5px] font-bold">과제 대시보드</span>
              <span className="text-muted-foreground block text-[10.5px]">
                AX추진실
              </span>
            </span>
          </Link>
          <MainTabs />
        </div>

        {/* 우측: 검색 / 마스터 / 새 과제 / 아바타 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="과제 검색 (⌘K) — 추후 제공"
            className="text-muted-foreground hover:text-foreground bg-card hidden items-center gap-2 rounded-[9px] border px-3 py-1.5 text-xs transition-colors lg:inline-flex"
          >
            <Search size={14} />
            과제 검색
            <kbd className="bg-muted text-faint rounded px-1 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/masters"
            title="마스터 관리"
            className="text-muted-foreground hover:text-foreground bg-card flex h-9 w-9 items-center justify-center rounded-[9px] border transition-colors"
          >
            <Building2 size={16} />
          </Link>

          <Link
            href="/projects/new"
            className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-[9px] px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
          >
            <Plus size={15} />새 과제
          </Link>

          <span
            title={userLabel ?? undefined}
            className="bg-accent text-accent-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
          >
            {initial}
          </span>

          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground rounded-[9px] border px-2.5 py-1.5 text-xs transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      {children}
    </div>
  );
}
