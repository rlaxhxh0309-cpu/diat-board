import { pageMetadata } from "@/utils/metadata";
import { ForgotPasswordForm } from "./form";

export const metadata = pageMetadata({
  title: "비밀번호 찾기",
  description: "가입한 이메일로 비밀번호 재설정 링크를 받아 보세요.",
  path: "/forgot-password",
  noindex: true,
});

export default async function Page(props: PageProps<"/forgot-password">) {
  const { error } = await props.searchParams;
  return <ForgotPasswordForm invalidLink={error === "invalid_link"} />;
}
