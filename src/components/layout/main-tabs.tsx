"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "과제 현황" },
  { href: "/performance", label: "성과 현황" },
  { href: "/budget", label: "투자비 현황" },
] as const;

/** 최상단 메뉴 탭 (과제 현황 / 성과 현황 / 투자비 현황) */
export function MainTabs() {
  const pathname = usePathname();

  return (
    <nav className="bg-muted inline-flex rounded-lg p-1 text-sm font-medium">
      {TABS.map((t) => {
        const active =
          t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-4 py-1.5 transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
