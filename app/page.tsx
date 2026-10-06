import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { formatDate, imageUrl, type Post } from "@/utils/posts";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, image_path, created_at")
    .order("created_at", { ascending: false })
    .overrideTypes<Omit<Post, "content">[], { merge: false }>();

  if (error) {
    return <p className="text-red-600">게시글을 불러오지 못했습니다.</p>;
  }

  if (!posts.length) {
    return (
      <div className="py-24 text-center text-neutral-500">
        <p>아직 게시글이 없습니다.</p>
        <Link href="/write" className="mt-3 inline-block underline">
          첫 글을 작성해 보세요
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.id}`}
            className="group block overflow-hidden rounded-xl border border-neutral-200 transition hover:shadow-md dark:border-neutral-800"
          >
            <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900">
              <Image
                src={imageUrl(post.image_path)}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition group-hover:scale-105"
              />
            </div>
            <div className="p-3">
              <h2 className="truncate font-medium">{post.title}</h2>
              <p className="mt-1 text-xs text-neutral-500">{formatDate(post.created_at)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
