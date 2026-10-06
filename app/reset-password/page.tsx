"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";

const ERROR_MESSAGES: Record<string, string> = {
  same_password: "기존 비밀번호와 다른 비밀번호를 입력해 주세요.",
  weak_password: "비밀번호가 너무 약합니다. 6자 이상으로 입력해 주세요.",
  session_not_found: "링크가 만료되었습니다. 비밀번호 찾기를 다시 진행해 주세요.",
  over_request_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
};

const toKoreanMessage = (error: AuthError) =>
  (error.code && ERROR_MESSAGES[error.code]) ||
  "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export default function ResetPasswordPage() {
  const router = useRouter();
  const showToast = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 리셋 링크로 생성된 세션이 없으면 접근 불가
  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        if (user) {
          setReady(true);
          return;
        }
        showToast("링크가 만료되었거나 유효하지 않습니다. 다시 요청해 주세요.");
        router.replace("/forgot-password");
      });
    return () => {
      cancelled = true;
    };
  }, [router, showToast]);

  const canSubmit = !!password && !!passwordConfirm && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (password !== passwordConfirm) {
      showToast("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    const { error } = await createClient().auth.updateUser({ password });

    if (error) {
      showToast(toKoreanMessage(error));
      setSubmitting(false);
      return;
    }

    showToast("비밀번호가 변경되었습니다", "success");
    router.push("/board");
    router.refresh();
  };

  if (!ready) return null;

  return (
    <form onSubmit={onSubmit} noValidate className="card mx-auto max-w-md space-y-5 p-6 sm:mt-4 sm:p-8">
      <h1 className="text-2xl font-bold">비밀번호 재설정</h1>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold">
          새 비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6자 이상"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="mb-2 block text-sm font-semibold">
          새 비밀번호 확인
        </label>
        <input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="새 비밀번호를 한 번 더 입력하세요"
          className="input-field"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary w-full"
      >
        {submitting ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
