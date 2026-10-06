"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";

const ERROR_MESSAGES: Record<string, string> = {
  user_already_exists: "이미 가입된 이메일입니다.",
  email_exists: "이미 가입된 이메일입니다.",
  weak_password: "비밀번호가 너무 약합니다. 6자 이상으로 입력해 주세요.",
  email_address_invalid: "올바른 이메일 주소를 입력해 주세요.",
  validation_failed: "입력한 정보를 다시 확인해 주세요.",
  over_email_send_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  signup_disabled: "현재 회원가입이 비활성화되어 있습니다.",
  email_provider_disabled: "현재 이메일 회원가입이 비활성화되어 있습니다.",
};

const toKoreanMessage = (error: AuthError) => {
  if (error.code === "validation_failed" && /email/i.test(error.message)) {
    return ERROR_MESSAGES.email_address_invalid;
  }
  return (
    (error.code && ERROR_MESSAGES[error.code]) ||
    "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요."
  );
};

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-300";

export default function SignupPage() {
  const router = useRouter();
  const showToast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!email.trim() && !!password && !!passwordConfirm && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (password !== passwordConfirm) {
      showToast("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });

    if (error) {
      showToast(toKoreanMessage(error));
      setSubmitting(false);
      return;
    }

    showToast("회원가입이 완료되었습니다", "success");
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-sm space-y-5 pt-8">
      <h1 className="text-2xl font-bold">회원가입</h1>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6자 이상"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="mb-2 block text-sm font-medium">
          비밀번호 확인
        </label>
        <input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호를 한 번 더 입력하세요"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-white dark:text-neutral-900 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
      >
        {submitting ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
