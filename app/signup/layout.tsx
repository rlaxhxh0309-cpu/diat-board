import { pageMetadata } from "@/utils/metadata";

// page.tsx가 클라이언트 컴포넌트라 메타데이터는 레이아웃에서 설정한다
export const metadata = pageMetadata({
  title: "회원가입",
  description: "이메일과 닉네임만으로 가입하고 다이어트 사진 기록을 시작해 보세요.",
  path: "/signup",
});

export default function Layout({ children }: LayoutProps<"/signup">) {
  return children;
}
