import type { Metadata } from "next";

export const SITE_NAME = "다이어트 사진 게시판";
export const SITE_DESCRIPTION =
  "오늘의 식단, 운동 인증, 몸의 변화를 사진으로 기록하고 좋아요와 응원 댓글로 서로 힘이 되어 주는 다이어트 게시판";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://diat-board.vercel.app";

// app/opengraph-image.tsx가 만드는 사이트 대표 썸네일
const SITE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME };

// 하위 페이지의 openGraph는 상위 설정(파일 기반 썸네일 포함)을 통째로 덮어쓰므로(shallow merge)
// 공통 값과 썸네일을 매번 넣어준다
const baseOpenGraph = {
  siteName: SITE_NAME,
  locale: "ko_KR",
  type: "website" as const,
  images: [SITE_IMAGE],
};

export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...baseOpenGraph, title: `${title} | ${SITE_NAME}`, description, url: path },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description, images: [SITE_IMAGE] },
    // 로그인해야 쓰는 페이지는 검색 결과에 노출하지 않는다
    ...(noindex && { robots: { index: false, follow: false } }),
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["다이어트", "식단", "운동", "다이어트 기록", "바디프로필", "사진 게시판", "응원"],
  alternates: { canonical: "/" },
  openGraph: { ...baseOpenGraph, title: SITE_NAME, description: SITE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  formatDetection: { telephone: false },
};
