"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { POST_IMAGES_BUCKET } from "@/utils/posts";
import { useToast } from "@/app/toast";
import { GUEST_WRITE_MESSAGE } from "@/app/write-button";

const MAX_SIZE = 10 * 1024 * 1024;

export default function WritePage() {
  const router = useRouter();
  const showToast = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주소창으로 직접 들어온 비회원도 막는다
  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        if (user) {
          setAuthChecked(true);
          return;
        }
        showToast(GUEST_WRITE_MESSAGE);
        router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router, showToast]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const canSubmit = !!file && title.trim().length > 0 && !submitting;

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
    if (!file || !title.trim()) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError("사진 업로드에 실패했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({ title: title.trim(), content: content.trim(), image_path: path })
      .select("id")
      .single();

    if (insertError || !data) {
      setError("게시글 등록에 실패했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
      return;
    }

    router.push(`/posts/${data.id}`);
    router.refresh();
  };

  if (!authChecked) return null;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">글쓰기</h1>

      <div>
        <span className="mb-2 block text-sm font-medium">
          사진 <span className="text-red-500">*</span>
        </span>
        <label className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기
            <img src={preview} alt="미리보기" className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm text-neutral-500">클릭해서 사진 선택 (최대 10MB)</span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
            className="sr-only"
          />
        </label>
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

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-white dark:text-neutral-900 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
      >
        {submitting ? "등록 중..." : "등록"}
      </button>
    </form>
  );
}
