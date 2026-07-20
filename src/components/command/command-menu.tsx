"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  List,
  TrendingUp,
  CircleDollarSign,
  Plus,
  Building2,
  Megaphone,
} from "lucide-react";

import { MPRS_COLORS, MPRS_LABEL, type Mprs } from "@/lib/domain/mprs";
import {
  LIFECYCLE_LABEL,
  HEALTH_COLOR_VAR,
  type Lifecycle,
  type Health,
} from "@/lib/domain/lifecycle";

export interface CommandProject {
  id: string;
  name: string;
  hq: string;
  lifecycle: Lifecycle;
  health: Health;
  progress: number;
  mprs: Mprs;
  pms: string;
  techs: string;
}

const NAV = [
  { href: "/", label: "대시보드", sub: "벤토 개요", Icon: LayoutDashboard },
  { href: "/projects", label: "과제 현황", sub: "표 · 포트폴리오 맵", Icon: List },
  { href: "/performance", label: "성과 현황", sub: "운영 효과지표", Icon: TrendingUp },
  { href: "/budget", label: "투자비 현황", sub: "CAPEX 집행", Icon: CircleDollarSign },
  { href: "/highlights", label: "금주 주요 사항", sub: "과제별 최신 진척", Icon: Megaphone },
  { href: "/projects/new", label: "새 과제 등록", sub: "생성 폼 열기", Icon: Plus },
  { href: "/masters", label: "마스터 관리", sub: "본부·부서·사람·AI기술", Icon: Building2 },
] as const;

const HEADING =
  "[&_[cmdk-group-heading]]:text-faint [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-wider";
const ITEM =
  "flex cursor-pointer items-center gap-2.5 px-4 py-2.5 data-[selected=true]:bg-[#F0EFFA]";

/** ⌘K 커맨드 팔레트 — 트리거 버튼 + 전역 단축키 + 이동/과제검색 */
export function CommandMenu({ projects }: { projects: CommandProject[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // OS별 단축키 표시 (맥=⌘K, 그 외=Ctrl K). SSR 기본값은 ⌘K, 마운트 후 보정.
  const [shortcut, setShortcut] = useState("⌘K");

  useEffect(() => {
    // userAgentData.platform("Windows"·"macOS")를 우선 사용, 없으면 platform/UA로 폴백.
    // 윈도우(Windows)면 무조건 Ctrl, 진짜 맥(Windows 미포함 + mac/iOS)만 ⌘.
    const navAny = navigator as Navigator & {
      userAgentData?: { platform?: string };
    };
    const src = `${navAny.userAgentData?.platform ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
    const isWindows = /win/i.test(src);
    const isMac = !isWindows && /mac|iphone|ipad|ipod/i.test(src);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShortcut(isMac ? "⌘K" : "Ctrl K");
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground bg-card hidden items-center gap-2 rounded-[9px] border px-3 py-1.5 text-xs transition-colors lg:inline-flex"
      >
        <Search size={14} />
        과제 검색
        <kbd className="bg-muted text-faint rounded px-1 text-[10px] font-medium">
          {shortcut}
        </kbd>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-[120]"
            style={{ background: "rgba(15,24,48,.4)" }}
          />
          <Dialog.Content
            aria-describedby={undefined}
            className="bg-card fixed left-1/2 top-[11vh] z-[120] w-[580px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(15,24,48,.35)]"
          >
            <Dialog.Title className="sr-only">검색</Dialog.Title>
            <Command label="검색" className="flex flex-col">
              <div className="flex items-center gap-2.5 border-b px-4 py-3.5">
                <Search size={18} className="text-muted-foreground" />
                <Command.Input
                  autoFocus
                  placeholder="과제명·본부·PM·AI기술 검색 또는 이동…"
                  className="text-foreground placeholder:text-faint flex-1 bg-transparent text-[15px] outline-none"
                />
                <kbd className="bg-muted text-faint rounded px-1.5 py-0.5 text-[10.5px] font-bold">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[420px] overflow-y-auto pb-2">
                <Command.Empty className="text-faint px-4 py-8 text-center text-[13px]">
                  결과가 없습니다.
                </Command.Empty>

                <Command.Group heading="이동 · 작업" className={HEADING}>
                  {NAV.map((n) => (
                    <Command.Item
                      key={n.href}
                      value={`${n.label} ${n.sub}`}
                      onSelect={() => go(n.href)}
                      className={ITEM}
                    >
                      <span className="bg-muted text-primary flex h-[30px] w-[30px] items-center justify-center rounded-lg">
                        <n.Icon size={16} />
                      </span>
                      <span className="flex-1">
                        <span className="text-[13.5px] font-semibold">
                          {n.label}
                        </span>
                        <span className="text-muted-foreground ml-2 text-[11.5px]">
                          {n.sub}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="과제" className={HEADING}>
                  {projects.map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`${p.name} ${p.hq} ${p.pms} ${p.techs}`}
                      onSelect={() => go(`/projects?detail=${p.id}`)}
                      className={ITEM}
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-extrabold"
                        style={{
                          background: MPRS_COLORS[p.mprs].bg,
                          color: MPRS_COLORS[p.mprs].text,
                        }}
                      >
                        {MPRS_LABEL[p.mprs][0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold">
                          {p.name}
                        </span>
                        <span className="text-muted-foreground block text-[11px]">
                          {p.hq} · {LIFECYCLE_LABEL[p.lifecycle]} ·{" "}
                          {p.pms || "PM 미정"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: HEALTH_COLOR_VAR[p.health] }}
                        />
                        <span className="text-muted-foreground text-[11.5px] tabular-nums">
                          {p.progress}%
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
