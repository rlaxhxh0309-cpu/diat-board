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
    <form onSubmit={onSubmit} className="card mx-auto max-w-2xl space-y-6 p-5 sm:p-8">
      <h1 className="text-2xl font-bold">글 수정</h1>

      <div>
        <span className="mb-2 block text-sm font-semibold">
          사진 <span className="text-coral">*</span>
        </span>
        <label className="flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-page transition hover:border-brand hover:bg-brand-soft/40 has-[:focus-visible]:border-brand has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 sm:aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기와 기존 사진 */}
          <img src={preview ?? imageUrl(post.image_path)} alt="미리보기" className="h-full w-full object-contain" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
            className="sr-only"
          />
        </label>
        <p className="mt-2 text-xs text-muted">사진을 클릭하면 다른 사진으로 바꿀 수 있습니다 (최대 10MB)</p>
      </div>

      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-semibold">
          제목 <span className="text-coral">*</span>
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="제목을 입력하세요"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="content" className="mb-2 block text-sm font-semibold">
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={8}
          placeholder="오늘의 식단, 운동, 변화 등을 기록해 보세요"
          className="input-field resize-y"
        />
      </div>

      {error && <p className="rounded-2xl bg-coral-soft px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Link
          href={`/posts/${post.id}`}
          className="btn-secondary flex-1"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary flex-1"
        >
          {submitting ? "수정 중..." : "수정 완료"}
        </button>
      </div>
    </form>
  );
}
