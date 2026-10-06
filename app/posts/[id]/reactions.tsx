"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";
import { COMMENT_SELECT, formatDateTime, type Comment } from "@/utils/posts";
import { Avatar } from "@/app/avatar";

const MAX_COMMENT = 500;

export function Reactions({
  postId,
  userId,
  initialLikeCount,
  initialLiked,
  initialComments,
}: {
  postId: string;
  userId: string | null;
  initialLikeCount: number;
  initialLiked: boolean;
  initialComments: Comment[];
}) {
  const showToast = useToast();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [liking, setLiking] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onToggleLike = async () => {
    if (!userId) {
      showToast("로그인 후 좋아요를 누를 수 있습니다");
      return;
    }
    if (liking) return;
    setLiking(true);

    // 화면을 먼저 바꾸고 실패하면 되돌린다
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    const supabase = createClient();
    const { error } = nextLiked
      ? await supabase.from("likes").insert({ post_id: postId })
      : await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);

    // 23505: 다른 탭에서 이미 누른 경우 — 좋아요 상태는 맞으므로 개수만 되돌린다
    if (error?.code === "23505") {
      setLikeCount((c) => c - 1);
    } else if (error) {
      setLiked(!nextLiked);
      setLikeCount((c) => c + (nextLiked ? -1 : 1));
      showToast("좋아요 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
    setLiking(false);
  };

  const onSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!userId) {
      showToast("로그인 후 댓글을 남길 수 있습니다");
      return;
    }
    if (!trimmed || submitting) return;
    setSubmitting(true);

    const { data, error } = await createClient()
      .from("comments")
      .insert({ post_id: postId, content: trimmed })
      .select(COMMENT_SELECT)
      .single<Comment>();

    if (error || !data) {
      showToast("댓글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } else {
      setComments((prev) => [...prev, data]);
      setContent("");
      showToast("응원 댓글을 남겼습니다", "success");
    }
    setSubmitting(false);
  };

  const onDeleteComment = async (id: number) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    const { error } = await createClient().from("comments").delete().eq("id", id);
    if (error) {
      showToast("댓글 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <section className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <button
        type="button"
        onClick={onToggleLike}
        disabled={liking}
        aria-pressed={liked}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-wait ${
          liked
            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
            : "border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
          <path strokeLinejoin="round" d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.6 5c2.1 0 3.5 1.1 4.4 2.5h2C13.9 6.1 15.3 5 17.4 5c3.4 0 5.4 3.6 4.1 6.8C19.5 16.4 12 21 12 21z" />
        </svg>
        좋아요 {likeCount}
      </button>

      <h2 className="mt-8 text-lg font-semibold">
        응원 댓글 <span className="text-neutral-500">{comments.length}</span>
      </h2>

      {comments.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">첫 응원 댓글을 남겨 주세요!</p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {comments.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Avatar src={c.profiles?.avatar_url} name={c.profiles?.nickname || "?"} size={20} />
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {c.profiles?.nickname || "알 수 없음"}
                </span>
                <span>{formatDateTime(c.created_at)}</span>
                {c.user_id === userId && (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(c.id)}
                    className="ml-auto cursor-pointer hover:text-red-600"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {userId ? (
        <form onSubmit={onSubmitComment} className="mt-4 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_COMMENT}
            rows={3}
            placeholder="따뜻한 응원 한마디를 남겨 주세요"
            className="w-full resize-y rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-300"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {content.length}/{MAX_COMMENT}
            </span>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-white dark:text-neutral-900 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
            >
              {submitting ? "등록 중..." : "댓글 등록"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:bg-neutral-900">
          <Link href="/login" className="font-medium text-neutral-900 underline dark:text-white">
            로그인
          </Link>
          하면 좋아요와 응원 댓글을 남길 수 있습니다.
        </p>
      )}
    </section>
  );
}
