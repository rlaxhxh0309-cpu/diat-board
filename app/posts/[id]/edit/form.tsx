"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";
import { imageUrl, POST_IMAGES_BUCKET, type Post } from "@/utils/posts";

const MAX_SIZE = 10 * 1024 * 1024;

export function EditForm({ post }: { post: Post }) {
  const router = useRouter();
  const showToast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const changed = !!file || title.trim() !== post.title || content.trim() !== post.content;
  const canSubmit = title.trim().length > 0 && changed && !submitting;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_SIZE) {
      setError("사진은 10MB 이하만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    let imagePath = post.image_path;

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      imagePath = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(POST_IMAGES_BUCKET)
        .upload(imagePath, file, { contentType: file.type });
      if (uploadError) {
        setError("사진 업로드에 실패했습니다. 다시 시도해 주세요.");
        setSubmitting(false);
        return;
      }
    }

    // RLS로 본인 글만 수정되므로, 실제로 수정된 행이 있는지 확인한다
    const { data, error: updateError } = await supabase
      .from("posts")
      .update({ title: title.trim(), content: content.trim(), image_path: imagePath })
      .eq("id", post.id)
      .select("id");

    if (updateError || !data?.length) {
      if (file) supabase.storage.from(POST_IMAGES_BUCKET).remove([imagePath]);
      setError("게시글 수정에 실패했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
      return;
    }

    // 사진을 바꿨으면 예전 사진은 정리한다 (실패해도 수정 결과에는 영향 없음)
    if (file) supabase.storage.from(POST_IMAGES_BUCKET).remove([post.image_path]);

    showToast("게시글이 수정되었습니다", "success");
    router.push(`/posts/${post.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">글 수정</h1>

      <div>
        <span className="mb-2 block text-sm font-medium">
          사진 <span className="text-red-500">*</span>
        </span>
        <label className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기와 기존 사진 */}
          <img src={preview ?? imageUrl(post.image_path)} alt="미리보기" className="h-full w-full object-contain" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
            className="sr-only"
          />
        </label>
        <p className="mt-2 text-xs text-neutral-500">사진을 클릭하면 다른 사진으로 바꿀 수 있습니다 (최대 10MB)</p>
      </div>

      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="제목을 입력하세요"
          className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-300"
        />
      </div>

      <div>
        <label htmlFor="content" className="mb-2 block text-sm font-medium">
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={8}
          placeholder="오늘의 식단, 운동, 변화 등을 기록해 보세요"
          className="w-full resize-y rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-300"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Link
          href={`/posts/${post.id}`}
          className="flex-1 rounded-lg border border-neutral-300 py-3 text-center font-medium transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-lg bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-white dark:text-neutral-900 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
        >
          {submitting ? "수정 중..." : "수정 완료"}
        </button>
      </div>
    </form>
  );
}
