import Link from "next/link";

import { getCurrentUser, signOut } from "@/lib/auth/actions";
import { MainTabs } from "@/components/layout/main-tabs";

/** 3개 현황 페이지 공용 레이아웃: 상단 헤더(제목 + 액션) + 탭 메뉴 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const userLabel =
    currentUser?.person?.name ?? currentUser?.authUser.email ?? null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-card flex items-center justify-between gap-6 border-b px-6 py-2.5">
        {/* 좌측: 제목 + (간격) + 탭 */}
        <div className="flex items-center gap-10">
          <div className="shrink-0">
            <h1 className="text-base font-semibold leading-tight">
              AX 과제 대시보드
            </h1>
            <p className="text-muted-foreground text-xs leading-tight">
              AX추진실
            </p>
          </div>
          <MainTabs />
        </div>

        {/* 우측: 액션 */}
        <div className="flex items-center gap-2">
          <Link
            href="/masters"
            className="text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs transition-colors"
          >
            마스터 관리
          </Link>
          <Link
            href="/projects/new"
            className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
          >
            + 새 과제
          </Link>
          {userLabel && (
            <span className="text-muted-foreground ml-2 hidden text-xs sm:inline">
              {userLabel}
            </span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs transition-colors"
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
