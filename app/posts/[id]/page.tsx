import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { formatDate, imageUrl, type Post } from "@/utils/posts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;
  if (!UUID_RE.test(id)) notFound();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle<Post>();

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="mt-4 text-2xl font-bold break-words">{post.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">{formatDate(post.created_at)}</p>
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
    </article>
  );
}
