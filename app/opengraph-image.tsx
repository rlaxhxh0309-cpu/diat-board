import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/utils/metadata";

// 카카오톡·SNS 등에 링크를 공유할 때 보이는 대표 썸네일 (게시글 상세는 게시글 사진을 쓴다)
export const alt = `${SITE_NAME} - 다이어트 기록을 사진으로 공유하세요`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE = "오늘의 식단·운동·변화를 사진으로 기록하고 함께 응원해요";
const BADGES = ["📸 사진 기록", "❤️ 좋아요", "💬 응원 댓글"];

// 기본 폰트에는 한글이 없어서, 쓰이는 글자만 담은 Noto Sans KR을 받아온다
async function loadKoreanFont(text: string) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`,
  ).then((res) => res.text());
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("Noto Sans KR 폰트를 찾지 못했습니다");
  return fetch(url).then((res) => res.arrayBuffer());
}

export default async function Image() {
  const font = await loadKoreanFont(SITE_NAME + TAGLINE + BADGES.join(""));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
          color: "#171717",
          fontFamily: "Noto Sans KR",
        }}
      >
        <div style={{ fontSize: 88, letterSpacing: -2 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 24, fontSize: 36, color: "#525252" }}>{TAGLINE}</div>
        <div style={{ marginTop: 56, display: "flex", gap: 16 }}>
          {BADGES.map((badge) => (
            <div
              key={badge}
              style={{
                padding: "12px 28px",
                borderRadius: 999,
                background: "#171717",
                color: "#ffffff",
                fontSize: 30,
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }] },
  );
}
