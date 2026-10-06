"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Category } from "@/utils/posts";
import { AuthNav, useAuth } from "./auth-nav";
import { WriteButton } from "./write-button";

const HIDDEN_ON = ["/login"];

// 상단 메뉴: 누르면 해당 카테고리 탭이 선택된 게시판으로 이동
const MENU: { category: Category; label: string; emoji: string }[] = [
  { category: "start", label: "시작했어요", emoji: "🌱" },
  { category: "progress", label: "진행 중", emoji: "🔥" },
  { category: "success", label: "해냈어요", emoji: "🏆" },
];

export function HeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  // 모바일 메뉴: Esc로 닫기
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (HIDDEN_ON.includes(pathname)) return null;

  const activeCategory = pathname === "/board" ? searchParams.get("category") : null;
  const close = () => setOpen(false);

  return (
    <nav aria-label="주 메뉴" className="flex items-center gap-2.5 lg:gap-5">
      {/* 데스크톱: 한 줄 메뉴 */}
      <ul className="hidden items-center gap-1 lg:flex">
        {MENU.map((m) => {
          const active = activeCategory === m.category;
          return (
            <li key={m.category}>
              <Link
                href={`/board?category=${m.category}`}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm whitespace-nowrap transition ${
                  active ? "bg-brand-soft font-semibold text-brand" : "text-muted hover:text-brand"
                }`}
              >
                <span aria-hidden="true">{m.emoji}</span>
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <span aria-hidden="true" className="hidden h-4 w-px bg-line lg:block" />
      <div className="hidden items-center gap-4 lg:flex">
        <AuthNav auth={auth} variant="bar" />
      </div>

      {/* 랜딩 페이지에서는 상단 글쓰기 버튼을 숨긴다 */}
      {pathname !== "/" && <WriteButton />}

      {/* 모바일: 햄버거 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-xl text-ink transition hover:bg-brand-soft hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 lg:hidden"
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <>
          {/* 바깥을 누르면 닫힌다 */}
          <div aria-hidden="true" onClick={close} className="fixed inset-0 top-16 z-30 bg-ink/20 lg:hidden" />
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full z-40 rounded-b-2xl border-b border-line bg-white px-4 pt-3 pb-5 shadow-card lg:hidden"
          >
            <p className="px-3 pb-1 text-xs font-semibold text-muted">다이어트 단계</p>
            <ul>
              {MENU.map((m) => {
                const active = activeCategory === m.category;
                return (
                  <li key={m.category}>
                    <Link
                      href={`/board?category=${m.category}`}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-xl px-3 py-3 transition ${
                        active ? "bg-brand-soft font-semibold text-brand" : "text-ink hover:bg-brand-soft hover:text-brand"
                      }`}
                    >
                      <span aria-hidden="true">{m.emoji}</span>
                      {m.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="my-3 h-px bg-line" />
            <div className="flex flex-col">
              <AuthNav auth={auth} variant="menu" onNavigate={close} />
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
