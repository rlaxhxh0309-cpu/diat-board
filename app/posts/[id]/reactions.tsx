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
  postAuthorId,
  initialLikeCount,
  initialLiked,
  initialComments,
}: {
  postId: string;
  userId: string | null;
  postAuthorId: string | null;
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
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // 대댓글은 게시글 작성자만 달 수 있다 (DB 정책과 같은 조건)
  const canReply = !!userId && userId === postAuthorId;
  const topLevel = comments.filter((c) => c.parent_id === null);
  const repliesOf = (id: number) => comments.filter((c) => c.parent_id === id);

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
    // 댓글을 지우면 달린 대댓글도 DB에서 함께 지워진다
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
  };

  const onSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    const trimmed = replyContent.trim();
    if (!trimmed || replying) return;
    setReplying(true);

    const { data, error } = await createClient()
      .from("comments")
      .insert({ post_id: postId, parent_id: parentId, content: trimmed })
      .select(COMMENT_SELECT)
      .single<Comment>();

    if (error || !data) {
      showToast("답글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } else {
      setComments((prev) => [...prev, data]);
      setReplyContent("");
      setReplyTo(null);
      showToast("답글을 남겼습니다", "success");
    }
    setReplying(false);
  };

  const onSubmitEdit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (!trimmed || saving) return;
    setSaving(true);

    const { data, error } = await createClient()
      .from("comments")
      .update({ content: trimmed })
      .eq("id", id)
      .select(COMMENT_SELECT)
      .single<Comment>();

    if (error || !data) {
      showToast("댓글 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } else {
      setComments((prev) => prev.map((c) => (c.id === id ? data : c)));
      setEditingId(null);
      showToast("댓글을 수정했습니다", "success");
    }
    setSaving(false);
  };

  const commentView = (c: Comment, avatarSize: number) => (
    <>
      <div className="flex items-center gap-2 text-xs text-muted">
        <Avatar src={c.profiles?.avatar_url} name={c.profiles?.nickname || "?"} size={avatarSize} />
        <span className="font-semibold text-ink">{c.profiles?.nickname || "알 수 없음"}</span>
        {c.user_id === postAuthorId && (
          <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">글쓴이</span>
        )}
        <span>
          {formatDateTime(c.created_at)}
          {c.updated_at && " (수정됨)"}
        </span>
        {c.user_id === userId && editingId !== c.id && (
          <span className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingId(c.id);
                setEditContent(c.content);
              }}
              className="cursor-pointer hover:text-brand"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => onDeleteComment(c.id)}
              className="cursor-pointer hover:text-red-600"
            >
              삭제
            </button>
          </span>
        )}
      </div>
      {editingId === c.id ? (
        <form onSubmit={(e) => onSubmitEdit(e, c.id)} className="mt-2 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={MAX_COMMENT}
            rows={2}
            autoFocus
            className="input-field resize-y text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {editContent.length}/{MAX_COMMENT}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="cursor-pointer px-3 py-2 text-sm text-muted transition hover:text-ink"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!editContent.trim() || editContent.trim() === c.content || saving}
                className="btn-primary px-4 py-2 text-sm"
              >
                {saving ? "저장 중..." : "수정 완료"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{c.content}</p>
      )}
    </>
  );

  return (
    <>
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onToggleLike}
          disabled={liking}
          aria-pressed={liked}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-6 py-3 font-semibold shadow-card transition disabled:cursor-wait ${
            liked ? "border-coral bg-coral-soft text-coral" : "border-line bg-white text-muted hover:border-coral hover:text-coral"
          }`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
            <path strokeLinejoin="round" d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.6 5c2.1 0 3.5 1.1 4.4 2.5h2C13.9 6.1 15.3 5 17.4 5c3.4 0 5.4 3.6 4.1 6.8C19.5 16.4 12 21 12 21z" />
          </svg>
          좋아요 {likeCount}
        </button>
      </div>

      <section className="card mt-5 p-5 sm:p-8">
        <h2 className="text-lg font-bold">
          응원 댓글 <span className="text-brand">{comments.length}</span>
        </h2>

        {comments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">첫 응원 댓글을 남겨 주세요! 💪</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {topLevel.map((c) => {
              const replies = repliesOf(c.id);
              return (
                <li key={c.id} className="py-4">
                  {commentView(c, 24)}
                  {canReply && replyTo !== c.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(c.id);
                        setReplyContent("");
                      }}
                      className="mt-1 cursor-pointer text-xs font-semibold text-muted transition hover:text-brand"
                    >
                      답글 달기
                    </button>
                  )}

                  {replies.length > 0 && (
                    <ul className="mt-3 space-y-3 border-l-2 border-brand-soft pl-4">
                      {replies.map((r) => (
                        <li key={r.id}>
                          {commentView(r, 20)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {canReply && replyTo === c.id && (
                    <form onSubmit={(e) => onSubmitReply(e, c.id)} className="mt-3 space-y-2 pl-4">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        maxLength={MAX_COMMENT}
                        rows={2}
                        autoFocus
                        placeholder="응원에 고마운 마음을 전해 보세요"
                        className="input-field resize-y text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">
                          {replyContent.length}/{MAX_COMMENT}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyTo(null)}
                            className="cursor-pointer px-3 py-2 text-sm text-muted transition hover:text-ink"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={!replyContent.trim() || replying}
                            className="btn-primary px-4 py-2 text-sm"
                          >
                            {replying ? "등록 중..." : "답글 등록"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </li>
              );
            })}
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
              className="input-field resize-y text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                {content.length}/{MAX_COMMENT}
              </span>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="btn-primary px-4 py-2 text-sm"
              >
                {submitting ? "등록 중..." : "댓글 등록"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-ink">
            <Link href="/login" className="font-semibold text-brand underline">
              로그인
            </Link>
            하면 좋아요와 응원 댓글을 남길 수 있습니다.
          </p>
        )}
      </section>
    </>
  );
}
