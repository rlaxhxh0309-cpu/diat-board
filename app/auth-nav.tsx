"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";

const linkClass =
  "text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white";

// 카카오 로그인은 닉네임을, 이메일 가입은 이메일을 보여준다
const displayName = (user: User) => {
  const meta = user.user_metadata ?? {};
  return meta.name || meta.full_name || meta.preferred_username || user.email || "회원";
};

export function AuthNav() {
  const router = useRouter();
  const showToast = useToast();
  // undefined: 아직 확인 전, null: 비로그인
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onLogout = async () => {
    const { error } = await createClient().auth.signOut();
    if (error) {
      showToast("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    showToast("로그아웃되었습니다", "success");
    router.push("/");
    router.refresh();
  };

  if (user === undefined) return null;

  if (user) {
    return (
      <>
        <span className="max-w-32 truncate text-sm text-neutral-500 sm:max-w-48">
          {displayName(user)}
        </span>
        <button type="button" onClick={onLogout} className={`${linkClass} cursor-pointer`}>
          로그아웃
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className={linkClass}>
        로그인
      </Link>
      <Link href="/signup" className={linkClass}>
        회원가입
      </Link>
    </>
  );
}
