import Image from "next/image";
import Link from "next/link";
import { formatDate, imageUrl, type Post } from "@/utils/posts";
import type { Author } from "@/utils/profile";
import { Avatar } from "@/app/avatar";
import { CategoryBadge } from "@/app/category-badge";

// 게시판 목록과 랜딩의 최근 게시글이 함께 쓰는 게시글 카드

export const POST_LIST_SELECT =
  "id, title, image_path, created_at, category, profiles(nickname, avatar_url), likes(count), comments(count)";

export type PostListItem = Omit<Post, "content" | "user_id"> & {
  profiles: Author;
  likes: { count: number }[];
  comments: { count: number }[];
};

export function PhotoGrid({
  posts,
  gridClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: {
  posts: PostListItem[];
  gridClassName?: string;
}) {
  return (
    <ul className={`grid gap-3 sm:gap-5 ${gridClassName}`}>
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.id}`}
            className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-page">
              <Image
                src={imageUrl(post.image_path)}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition group-hover:scale-105"
              />
              <CategoryBadge category={post.category} className="absolute top-2 left-2 shadow-card sm:top-3 sm:left-3" />
            </div>
            <div className="p-3 sm:p-4">
              <h2 className="truncate font-bold">{post.title}</h2>
              {/* 좁은 화면에서도 줄이 깨지지 않게 닉네임 줄에 숫자를, 날짜는 따로 둔다 */}
              <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Avatar src={post.profiles?.avatar_url} name={post.profiles?.nickname || "?"} size={18} />
                  <span className="truncate">{post.profiles?.nickname || "알 수 없음"}</span>
                </span>
                <Counts post={post} />
              </div>
              <p className="mt-1 truncate text-xs text-muted">{formatDate(post.created_at)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Counts({ post, showComments = true }: { post: PostListItem; showComments?: boolean }) {
  const likes = post.likes[0]?.count ?? 0;
  const comments = post.comments[0]?.count ?? 0;
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="flex items-center gap-0.5" aria-label={`좋아요 ${likes}개`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-coral" fill="currentColor" stroke="currentColor" strokeWidth={2}>
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
