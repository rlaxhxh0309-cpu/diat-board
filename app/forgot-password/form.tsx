"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";

const toKoreanMessage = (error: AuthError) => {
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (error.code === "email_address_invalid" || /email/i.test(error.message)) {
    return "올바른 이메일 주소를 입력해 주세요.";
  }
  return "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
};

export function ForgotPasswordForm({ invalidLink }: { invalidLink: boolean }) {
  const showToast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const invalidLinkShown = useRef(false);

  useEffect(() => {
    if (invalidLink && !invalidLinkShown.current) {
      invalidLinkShown.current = true;
      showToast("링크가 만료되었거나 유효하지 않습니다. 다시 요청해 주세요.");
    }
  }, [invalidLink, showToast]);

  const canSubmit = !!email.trim() && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      showToast(toKoreanMessage(error));
      return;
    }

    setSent(true);
    showToast("비밀번호 재설정 링크를 발송했습니다", "success");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="card mx-auto max-w-md space-y-5 p-6 sm:mt-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
        <p className="mt-2 text-sm text-muted">
          가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary w-full"
      >
        {submitting ? "발송 중..." : "비밀번호 리셋 링크 발송"}
      </button>

      {sent && (
        <p className="rounded-2xl bg-page p-3 text-sm text-muted">
          메일함을 확인해 주세요. 링크는 이 브라우저에서 열어야 합니다.
        </p>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-brand hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </form>
  );
}
