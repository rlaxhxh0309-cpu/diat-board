import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "./toast";
import { HeaderNav } from "./header-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "다이어트 사진 게시판",
  description: "다이어트 기록을 사진으로 공유하는 게시판",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <header className="border-b border-neutral-200 dark:border-neutral-800">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <Link href="/" className="text-lg font-semibold">
                다이어트 사진 게시판
              </Link>
              <HeaderNav />
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
