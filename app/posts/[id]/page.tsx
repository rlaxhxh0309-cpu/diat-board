import { cache } from "react";
import type { Metadata } from "next";
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
import { pageMetadata } from "@/utils/metadata";

// generateMetadata와 페이지가 같은 글을 한 번만 조회하도록 캐시한다
const getPost = cache(async (id: string) => {
  if (!UUID_RE.test(id)) return null;
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("posts")
    .select("*, profiles(nickname, avatar_url)")
    .eq("id", id)
    .maybeSingle<Post & { profiles: Author }>();
  return data;
});

export async function generateMetadata(props: PageProps<"/posts/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const post = await getPost(id);
  if (!post) return { title: "게시글을 찾을 수 없습니다", robots: { index: false } };

  const author = post.profiles?.nickname;
  const summary = post.content.replace(/\s+/g, " ").trim();
  const description =
    (summary.length > 100 ? `${summary.slice(0, 100)}…` : summary) ||
    `${author ? `${author}님의 ` : ""}다이어트 기록을 확인하고 응원 댓글을 남겨 보세요.`;
  const base = pageMetadata({ title: post.title, description, path: `/posts/${post.id}` });

  // 링크 썸네일은 게시글 사진을 쓴다
  const image = { url: imageUrl(post.image_path), alt: post.title };
  return {
    ...base,
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.created_at,
      authors: author ? [author] : undefined,
      images: [image],
    },
    twitter: { ...base.twitter, images: [image] },
  };
}

export default async function Page(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;
  const post = await getPost(id);
  if (!post) notFound();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

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
    <article className="mx-auto max-w-2xl">
      <Link href="/board" className="text-sm text-muted transition hover:text-brand">
        ← 목록으로
      </Link>
      <div className="card mt-4 overflow-hidden">
        <div className="bg-page">
          <Image
            src={imageUrl(post.image_path)}
            alt={post.title}
            width={1200}
            height={1200}
            sizes="(min-width: 672px) 672px, 100vw"
            className="h-auto max-h-[80vh] w-full object-contain"
            preload
          />
        </div>
        <div className="p-5 sm:p-8">
          <h1 className="text-2xl font-bold break-words">{post.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Avatar src={post.profiles?.avatar_url} name={post.profiles?.nickname || "?"} size={28} />
            <span className="font-semibold text-ink">{post.profiles?.nickname || "알 수 없음"}</span>
            <span>{formatDate(post.created_at)}</span>
            {user && post.user_id === user.id && (
              <span className="ml-auto flex items-center gap-3">
                <Link href={`/posts/${post.id}/edit`} className="text-sm text-muted transition hover:text-brand">
                  수정
                </Link>
                <DeletePostButton postId={post.id} imagePath={post.image_path} />
              </span>
            )}
          </div>
          {post.content && <p className="mt-5 whitespace-pre-wrap break-words leading-7">{post.content}</p>}
        </div>
      </div>
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
