"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";
import { POST_IMAGES_BUCKET } from "@/utils/posts";

export function DeletePostButton({ postId, imagePath }: { postId: string; imagePath: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!confirm("게시글을 삭제할까요? 좋아요와 댓글도 함께 삭제됩니다.")) return;
    setDeleting(true);
    const supabase = createClient();

    // RLS로 본인 글만 지워지므로, 실제로 지워진 행이 있는지 확인한다
    const { data, error } = await supabase.from("posts").delete().eq("id", postId).select("id");
    if (error || !data?.length) {
      showToast("게시글 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setDeleting(false);
      return;
    }

    // 사진 정리 (실패해도 글 삭제 결과에는 영향 없음)
    supabase.storage.from(POST_IMAGES_BUCKET).remove([imagePath]);

    showToast("게시글이 삭제되었습니다", "success");
    router.push("/board");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={deleting}
      className="cursor-pointer text-sm text-muted hover:text-red-600 disabled:cursor-wait"
    >
      {deleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
