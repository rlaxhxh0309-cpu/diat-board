"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
  email_not_confirmed: "이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.",
  user_banned: "이용이 제한된 계정입니다.",
  over_request_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  email_provider_disabled: "현재 이메일 로그인이 비활성화되어 있습니다.",
};

const toKoreanMessage = (error: AuthError) => {
  if (error.code === "validation_failed" && /email/i.test(error.message)) {
    return "올바른 이메일 주소를 입력해 주세요.";
  }
  return (
    (error.code && ERROR_MESSAGES[error.code]) ||
    "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요."
  );
};

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-300";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: "카카오 로그인이 취소되었습니다.",
  oauth_failed: "카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const oauthErrorShown = useRef(false);

  // /auth/callback에서 실패해 돌아온 경우
  useEffect(() => {
    const message = oauthError && OAUTH_ERROR_MESSAGES[oauthError];
    if (message && !oauthErrorShown.current) {
      oauthErrorShown.current = true;
      showToast(message);
      router.replace("/login");
    }
  }, [oauthError, router, showToast]);

  const canSubmit = !!email.trim() && !!password && !submitting;

  const onKakaoLogin = async () => {
    setKakaoLoading(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    // 성공하면 카카오 로그인 화면으로 이동하므로 실패한 경우만 처리
    if (error) {
      showToast(OAUTH_ERROR_MESSAGES.oauth_failed);
      setKakaoLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      showToast(toKoreanMessage(error));
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-sm space-y-5 pt-8">
      <h1 className="text-2xl font-bold">로그인</h1>

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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-white dark:text-neutral-900 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
      >
        {submitting ? "로그인 중..." : "로그인"}
      </button>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        또는
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <button
        type="button"
        onClick={onKakaoLogin}
        disabled={kakaoLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] py-3 font-medium text-black/85 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.27 4.66 6.67-.15.53-.98 3.4-1.01 3.62 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.43 4.28-2.84.57.08 1.15.12 1.74.12 5.52 0 10-3.54 10-7.9S17.52 3 12 3z" />
        </svg>
        {kakaoLoading ? "카카오로 이동 중..." : "카카오로 시작하기"}
      </button>

      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-neutral-500 underline hover:text-neutral-900 dark:hover:text-white">
          비밀번호를 잊으셨나요?
        </Link>
      </p>

      <p className="text-center text-sm text-neutral-500">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline dark:text-white">
          회원가입
        </Link>
      </p>
    </form>
  );
}
