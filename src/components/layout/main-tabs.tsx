"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  TrendingUp,
  CircleDollarSign,
  Megaphone,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/projects", label: "과제 현황", icon: List },
  { href: "/performance", label: "성과 현황", icon: TrendingUp },
  { href: "/budget", label: "투자비 현황", icon: CircleDollarSign },
  { href: "/highlights", label: "금주 주요 사항", icon: Megaphone },
] as const;

/** 상단 플로팅 필 내비 (active = navy 배경 + 흰 텍스트) */
export function MainTabs() {
  const pathname = usePathname();

  return (
    <nav className="bg-card inline-flex gap-0.5 rounded-[13px] border p-1">
      {TABS.map((t) => {
        const active =
          t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition-colors",
              active
                ? "bg-navy text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={15} strokeWidth={2} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
