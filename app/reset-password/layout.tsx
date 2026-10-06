import { pageMetadata } from "@/utils/metadata";

// page.tsx가 클라이언트 컴포넌트라 메타데이터는 레이아웃에서 설정한다
export const metadata = pageMetadata({
  title: "비밀번호 재설정",
  description: "새 비밀번호를 설정해 주세요.",
  path: "/reset-password",
  noindex: true,
});

export default function Layout({ children }: LayoutProps<"/reset-password">) {
  return children;
}
