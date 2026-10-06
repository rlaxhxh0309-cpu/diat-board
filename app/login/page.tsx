import { LoginForm } from "./form";

export default async function Page(props: PageProps<"/login">) {
  const { error } = await props.searchParams;
  return <LoginForm oauthError={typeof error === "string" ? error : undefined} />;
}
