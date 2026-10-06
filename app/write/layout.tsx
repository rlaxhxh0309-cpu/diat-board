import { pageMetadata } from "@/utils/metadata";

// page.tsx가 클라이언트 컴포넌트라 메타데이터는 레이아웃에서 설정한다
export const metadata = pageMetadata({
  title: "글쓰기",
  description: "오늘의 식단, 운동, 몸의 변화를 사진과 함께 기록해 보세요.",
  path: "/write",
  noindex: true,
});

export default function Layout({ children }: LayoutProps<"/write">) {
  return children;
}
