import { pageMetadata } from "@/utils/metadata";
import { LoginForm } from "./form";

export const metadata = pageMetadata({
  title: "로그인",
  description: "이메일 또는 카카오 계정으로 로그인하고 오늘의 다이어트 기록을 공유해 보세요.",
  path: "/login",
});

export default async function Page(props: PageProps<"/login">) {
  const { error } = await props.searchParams;
  return <LoginForm oauthError={typeof error === "string" ? error : undefined} />;
}
