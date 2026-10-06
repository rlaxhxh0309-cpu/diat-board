import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { formatDate, imageUrl, type Post } from "@/utils/posts";
import type { Author } from "@/utils/profile";
import { Avatar } from "./avatar";

type PostListItem = Omit<Post, "content" | "user_id"> & {
  profiles: Author;
  likes: { count: number }[];
  comments: { count: number }[];
};

// photo: 사진 카드, title: 제목 목록
type View = "photo" | "title";

const PAGE_SIZE = 8;

const listHref = (page: number, view: View) => {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (view === "title") params.set("view", "title");
  const query = params.toString();
  return query ? `/?${query}` : "/";
};

export default async function Page(props: PageProps<"/">) {
  const { page: pageParam, view: viewParam } = await props.searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const view: View = viewParam === "title" ? "title" : "photo";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const from = (page - 1) * PAGE_SIZE;
  const { data: posts, count, error } = await supabase
    .from("posts")
    .select(
      "id, title, image_path, created_at, profiles(nickname, avatar_url), likes(count), comments(count)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<PostListItem[], { merge: false }>();

  // 글 수보다 큰 페이지를 요청하면 PostgREST가 PGRST103 오류를 내므로 마지막 페이지로 보낸다
  if (error?.code === "PGRST103") {
    const { count: total } = await supabase.from("posts").select("*", { count: "exact", head: true });
    redirect(listHref(Math.ceil((total ?? 0) / PAGE_SIZE), view));
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

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
    <>
      <ViewToggle page={page} view={view} />
      {view === "photo" ? <PhotoGrid posts={posts} /> : <TitleList posts={posts} />}
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} view={view} />}
    </>
  );
}

function ViewToggle({ page, view }: { page: number; view: View }) {
  const options: { value: View; label: string }[] = [
    { value: "photo", label: "사진" },
    { value: "title", label: "제목" },
  ];
  return (
    <div className="mb-4 flex justify-end">
      <div role="group" aria-label="보기 방식" className="inline-flex rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-800">
        {options.map((o) => (
          <Link
            key={o.value}
            href={listHref(page, o.value)}
            aria-current={view === o.value ? "true" : undefined}
            className={`rounded-md px-3 py-1 text-sm transition ${
              view === o.value
                ? "bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function PhotoGrid({ posts }: { posts: PostListItem[] }) {
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
              <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <Avatar src={post.profiles?.avatar_url} name={post.profiles?.nickname || "?"} size={18} />
                <span className="truncate">{post.profiles?.nickname || "알 수 없음"}</span>
              </p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span>{formatDate(post.created_at)}</span>
                <Counts post={post} />
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TitleList({ posts }: { posts: PostListItem[] }) {
  return (
    <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-4 px-2 py-3 transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <h2 className="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
              <span className="truncate">{post.title}</span>
              {(post.comments[0]?.count ?? 0) > 0 && (
                <span className="shrink-0 text-sm text-red-500" aria-label={`댓글 ${post.comments[0].count}개`}>
                  [{post.comments[0].count}]
                </span>
              )}
            </h2>
            <span className="hidden max-w-32 items-center gap-1.5 text-xs text-neutral-600 sm:flex dark:text-neutral-400">
              <Avatar src={post.profiles?.avatar_url} name={post.profiles?.nickname || "?"} size={18} />
              <span className="truncate">{post.profiles?.nickname || "알 수 없음"}</span>
            </span>
            <span className="hidden shrink-0 text-xs text-neutral-500 sm:inline">{formatDate(post.created_at)}</span>
            <span className="text-xs text-neutral-500">
              <Counts post={post} showComments={false} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Counts({ post, showComments = true }: { post: PostListItem; showComments?: boolean }) {
  const likes = post.likes[0]?.count ?? 0;
  const comments = post.comments[0]?.count ?? 0;
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="flex items-center gap-0.5" aria-label={`좋아요 ${likes}개`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinejoin="round" d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.6 5c2.1 0 3.5 1.1 4.4 2.5h2C13.9 6.1 15.3 5 17.4 5c3.4 0 5.4 3.6 4.1 6.8C19.5 16.4 12 21 12 21z" />
        </svg>
        {likes}
      </span>
      {showComments && (
        <span className="flex items-center gap-0.5" aria-label={`댓글 ${comments}개`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinejoin="round" d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          </svg>
          {comments}
        </span>
      )}
    </span>
  );
}

function Pagination({ page, totalPages, view }: { page: number; totalPages: number; view: View }) {
  const itemClass = "flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm";
  const linkClass = `${itemClass} text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900`;
  const disabledClass = `${itemClass} text-neutral-300 dark:text-neutral-700`;

  return (
    <nav aria-label="페이지 이동" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={listHref(page - 1, view)} className={linkClass}>
          이전
        </Link>
      ) : (
        <span className={disabledClass}>이전</span>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className={`${itemClass} bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-900`}
          >
            {n}
          </span>
        ) : (
          <Link key={n} href={listHref(n, view)} className={linkClass}>
            {n}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={listHref(page + 1, view)} className={linkClass}>
          다음
        </Link>
      ) : (
        <span className={disabledClass}>다음</span>
      )}
    </nav>
  );
}
