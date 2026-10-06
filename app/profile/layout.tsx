import { pageMetadata } from "@/utils/metadata";

// page.tsx가 클라이언트 컴포넌트라 메타데이터는 레이아웃에서 설정한다
export const metadata = pageMetadata({
  title: "내 정보",
  description: "닉네임, 프로필 사진, 비밀번호를 변경할 수 있습니다.",
  path: "/profile",
  noindex: true,
});

export default function Layout({ children }: LayoutProps<"/profile">) {
  return children;
}
