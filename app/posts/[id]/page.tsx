import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { COMMENT_SELECT, formatDate, imageUrl, UUID_RE, type Comment, type Post } from "@/utils/posts";
import type { Author } from "@/utils/profile";
import { Avatar } from "@/app/avatar";
import { Reactions } from "./reactions";
import { DeletePostButton } from "./delete-button";

export default async function Page(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;
  if (!UUID_RE.test(id)) notFound();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(nickname, avatar_url)")
    .eq("id", id)
    .maybeSingle<Post & { profiles: Author }>();

  if (!post) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: likeCount }, { data: myLike }, { data: comments }] = await Promise.all([
    supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", id),
    user
      ? supabase.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("post_id", id)
      .order("created_at", { ascending: true })
      .overrideTypes<Comment[], { merge: false }>(),
  ]);

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="mt-4 text-2xl font-bold break-words">{post.title}</h1>
      <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
        <Avatar src={post.profiles?.avatar_url} name={post.profiles?.nickname || "?"} size={24} />
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          {post.profiles?.nickname || "알 수 없음"}
        </span>
        <span>{formatDate(post.created_at)}</span>
        {user && post.user_id === user.id && (
          <span className="ml-auto flex items-center gap-3">
            <Link href={`/posts/${post.id}/edit`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              수정
            </Link>
            <DeletePostButton postId={post.id} imagePath={post.image_path} />
          </span>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
        <Image
          src={imageUrl(post.image_path)}
          alt={post.title}
          width={1200}
          height={1200}
          sizes="(min-width: 768px) 768px, 100vw"
          className="h-auto max-h-[80vh] w-full object-contain"
          preload
        />
      </div>
      {post.content && (
        <p className="mt-6 whitespace-pre-wrap break-words leading-7">{post.content}</p>
      )}
      <Reactions
        postId={post.id}
        userId={user?.id ?? null}
        initialLikeCount={likeCount ?? 0}
        initialLiked={!!myLike}
        initialComments={comments ?? []}
      />
    </article>
  );
}
