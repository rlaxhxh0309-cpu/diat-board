import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { UUID_RE, type Post } from "@/utils/posts";
import { EditForm } from "./form";

export default async function Page(props: PageProps<"/posts/[id]/edit">) {
  const { id } = await props.params;
  if (!UUID_RE.test(id)) notFound();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: post }, { data: { user } }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).maybeSingle<Post>(),
    supabase.auth.getUser(),
  ]);

  if (!post) notFound();
  // 글쓴이가 아니면 글 보기로 돌려보낸다 (DB에서도 본인 글만 수정 가능)
  if (!user || post.user_id !== user.id) redirect(`/posts/${id}`);

  return <EditForm post={post} />;
}
