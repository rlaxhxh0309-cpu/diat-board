"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "./auth-nav";
import { WriteButton } from "./write-button";

const HIDDEN_ON = ["/login"];

export function HeaderNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  const onBoard = pathname === "/board" || pathname.startsWith("/posts/");

  return (
    <nav className="flex items-center gap-2.5 sm:gap-4">
      <Link
        href="/board"
        aria-current={pathname === "/board" ? "page" : undefined}
        className={`shrink-0 text-sm transition hover:text-brand ${onBoard ? "font-semibold text-brand" : "text-muted"}`}
      >
        게시판
      </Link>
      <AuthNav />
      {/* 랜딩 페이지에서는 상단 글쓰기 버튼을 숨긴다 */}
      {pathname !== "/" && <WriteButton />}
    </nav>
  );
}
