import type { Metadata, Viewport } from "next";
import { rootMetadata } from "@/utils/metadata";
import { Suspense } from "react";
import Link from "next/link";
import { ToastProvider } from "./toast";
import { HeaderNav } from "./header-nav";
import "./globals.css";

// 아이콘은 app/favicon.ico, 대표 썸네일은 app/opengraph-image.tsx가 자동으로 연결된다
export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: "#f7f9f8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard: 화면에 쓰인 글자만 나눠 받는 dynamic subset */}
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ToastProvider>
          {/* backdrop-filter를 쓰면 모바일 메뉴의 fixed 배경이 헤더 안에 갇히므로 불투명 배경을 쓴다 */}
          <header className="sticky top-0 z-40 border-b border-line bg-white">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
              <Link href="/" aria-label="다이어트 사진 게시판 홈" className="flex shrink-0 items-center gap-1.5 text-lg font-bold text-ink">
                <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand text-base text-white">
                  🌱
                </span>
                <span className="hidden sm:inline">다이어트 사진 게시판</span>
              </Link>
              {/* HeaderNav는 현재 카테고리를 알기 위해 useSearchParams를 쓴다 */}
              <Suspense>
                <HeaderNav />
              </Suspense>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
