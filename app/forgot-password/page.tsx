import { ForgotPasswordForm } from "./form";

export default async function Page(props: PageProps<"/forgot-password">) {
  const { error } = await props.searchParams;
  return <ForgotPasswordForm invalidLink={error === "invalid_link"} />;
}
