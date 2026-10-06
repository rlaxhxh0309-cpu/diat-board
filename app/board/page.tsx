import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CATEGORIES, formatDate, isCategory, type Category } from "@/utils/posts";
import { pageMetadata } from "@/utils/metadata";
import { Avatar } from "@/app/avatar";
import { CategoryBadge } from "@/app/category-badge";
import { Counts, PhotoGrid, POST_LIST_SELECT, type PostListItem } from "@/app/post-cards";

export const metadata = pageMetadata({
  title: "게시판",
  description: "다른 사람들의 식단, 운동, 몸의 변화 기록을 사진으로 구경하고 응원 댓글을 남겨 보세요.",
  path: "/board",
});

// photo: 사진 카드, title: 제목 목록
type View = "photo" | "title";

// 목록 주소에 담기는 상태 (category가 null이면 전체)
type ListState = { page: number; view: View; category: Category | null };

const PAGE_SIZE = 8;

const listHref = ({ page, view, category }: ListState) => {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  if (view === "title") params.set("view", "title");
  const query = params.toString();
  return query ? `/board?${query}` : "/board";
};

export default async function Page(props: PageProps<"/board">) {
  const { page: pageParam, view: viewParam, category: categoryParam } = await props.searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const view: View = viewParam === "title" ? "title" : "photo";
  const category = isCategory(categoryParam) ? categoryParam : null;
  const state: ListState = { page, view, category };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const from = (page - 1) * PAGE_SIZE;
  let query = supabase.from("posts").select(POST_LIST_SELECT, { count: "exact" });
  if (category) query = query.eq("category", category);
  const { data: posts, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<PostListItem[], { merge: false }>();

  // 글 수보다 큰 페이지를 요청하면 PostgREST가 PGRST103 오류를 내므로 마지막 페이지로 보낸다
  if (error?.code === "PGRST103") {
    let countQuery = supabase.from("posts").select("*", { count: "exact", head: true });
    if (category) countQuery = countQuery.eq("category", category);
    const { count: total } = await countQuery;
    redirect(listHref({ ...state, page: Math.ceil((total ?? 0) / PAGE_SIZE) }));
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  if (error) {
    return <p className="text-red-600">게시글을 불러오지 못했습니다.</p>;
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryTabs state={state} />
        <ViewToggle state={state} />
      </div>
      {!posts.length ? (
        <EmptyState category={category} />
      ) : view === "photo" ? (
        <PhotoGrid posts={posts} />
      ) : (
        <TitleList posts={posts} />
      )}
      {totalPages > 1 && <Pagination state={state} totalPages={totalPages} />}
    </>
  );
}

function CategoryTabs({ state }: { state: ListState }) {
  const tabs = [{ value: null, label: "전체", emoji: "" }, ...CATEGORIES];
  return (
    // 모바일에서는 탭이 넘치면 가로로 밀어서 볼 수 있다
    <nav aria-label="다이어트 단계" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2">
        {tabs.map((tab) => {
          const active = state.category === tab.value;
          return (
            <li key={tab.label}>
              <Link
                href={listHref({ ...state, category: tab.value, page: 1 })}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1 rounded-2xl border px-4 py-2 text-sm whitespace-nowrap transition ${
                  active
                    ? "border-brand bg-brand font-semibold text-white"
                    : "border-line bg-white text-muted hover:border-brand hover:text-brand"
                }`}
              >
                {tab.emoji && <span aria-hidden="true">{tab.emoji}</span>}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function EmptyState({ category }: { category: Category | null }) {
  const label = category && CATEGORIES.find((c) => c.value === category)?.label;
  return (
    <div className="card flex flex-col items-center px-6 py-20 text-center text-muted">
      <span aria-hidden="true" className="mb-3 text-4xl">🥗</span>
      <p>{label ? `아직 '${label}' 게시글이 없습니다.` : "아직 게시글이 없습니다."}</p>
      <Link href="/write" className="btn-primary mt-5">
        첫 글을 작성해 보세요
      </Link>
    </div>
  );
}

function ViewToggle({ state }: { state: ListState }) {
  const options: { value: View; label: string }[] = [
    { value: "photo", label: "사진" },
    { value: "title", label: "제목" },
  ];
  return (
    <div className="flex justify-end">
      <div role="group" aria-label="보기 방식" className="inline-flex rounded-2xl border border-line bg-white p-1">
        {options.map((o) => (
          <Link
            key={o.value}
            href={listHref({ ...state, view: o.value })}
            aria-current={state.view === o.value ? "true" : undefined}
            className={`rounded-xl px-4 py-1.5 text-sm transition ${
              state.view === o.value
                ? "bg-brand font-semibold text-white"
                : "text-muted hover:text-brand"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TitleList({ posts }: { posts: PostListItem[] }) {
  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-4 px-4 py-4 transition hover:bg-brand-soft/40"
          >
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-1.5 font-semibold">
                <CategoryBadge category={post.category} />
                <span className="truncate">{post.title}</span>
                {(post.comments[0]?.count ?? 0) > 0 && (
                  <span className="shrink-0 text-sm font-bold text-coral" aria-label={`댓글 ${post.comments[0].count}개`}>
                    [{post.comments[0].count}]
                  </span>
                )}
              </h2>
              {/* 모바일: 글쓴이·날짜를 제목 아래 한 줄로 */}
              <p className="mt-0.5 truncate text-xs text-muted sm:hidden">
                {post.profiles?.nickname || "알 수 없음"} · {formatDate(post.created_at)}
              </p>
            </div>
            <span className="hidden max-w-32 items-center gap-1.5 text-xs text-muted sm:flex">
              <Avatar src={post.profiles?.avatar_url} name={post.profiles?.nickname || "?"} size={18} />
              <span className="truncate">{post.profiles?.nickname || "알 수 없음"}</span>
            </span>
            <span className="hidden shrink-0 text-xs text-muted sm:inline">{formatDate(post.created_at)}</span>
            <span className="text-xs text-muted">
              <Counts post={post} showComments={false} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Pagination({ state, totalPages }: { state: ListState; totalPages: number }) {
  const { page } = state;
  const itemClass = "flex h-9 min-w-9 items-center justify-center rounded-2xl px-3 text-sm";
  const linkClass = `${itemClass} text-muted hover:bg-white hover:text-brand`;
  const disabledClass = `${itemClass} text-muted/50`;

  return (
    <nav aria-label="페이지 이동" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={listHref({ ...state, page: page - 1 })} className={linkClass}>
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
            className={`${itemClass} bg-brand font-semibold text-white`}
          >
            {n}
          </span>
        ) : (
          <Link key={n} href={listHref({ ...state, page: n })} className={linkClass}>
            {n}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={listHref({ ...state, page: page + 1 })} className={linkClass}>
          다음
        </Link>
      ) : (
        <span className={disabledClass}>다음</span>
      )}
    </nav>
  );
}
