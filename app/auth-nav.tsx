"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";
import { Avatar } from "@/app/avatar";
import { displayName, getOrCreateProfile, PROFILE_UPDATED_EVENT, type Profile } from "@/utils/profile";

// 상단바의 로그인 상태 (헤더에서 한 번만 불러와 데스크톱 메뉴·모바일 메뉴가 같이 쓴다)
export function useAuth() {
  const router = useRouter();
  const showToast = useToast();
  // undefined: 아직 확인 전, null: 비로그인
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 로그인 사용자의 프로필(닉네임·사진)을 불러오고, 내 정보에서 저장하면 다시 불러온다
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = () =>
      getOrCreateProfile(createClient(), user).then((p) => {
        if (!cancelled) setProfile(p);
      });
    load();
    window.addEventListener(PROFILE_UPDATED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_UPDATED_EVENT, load);
    };
  }, [user]);

  const logout = async () => {
    const { error } = await createClient().auth.signOut();
    if (error) {
      showToast("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    showToast("로그아웃되었습니다", "success");
    router.push("/");
    router.refresh();
  };

  return { user, profile, logout };
}

export type Auth = ReturnType<typeof useAuth>;

const barLinkClass = "shrink-0 text-sm text-muted transition hover:text-brand";
const menuLinkClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-left text-ink transition hover:bg-brand-soft hover:text-brand";

// variant "bar": 데스크톱 상단바에 한 줄로, "menu": 모바일 햄버거 메뉴 안에 세로로
export function AuthNav({
  auth: { user, profile, logout },
  variant,
  onNavigate,
}: {
  auth: Auth;
  variant: "bar" | "menu";
  onNavigate?: () => void;
}) {
  if (user === undefined) return null;
  const linkClass = variant === "bar" ? barLinkClass : menuLinkClass;

  if (user) {
    const name = displayName(profile?.nickname, user.email);
    return (
      <>
        <span
          className={
            variant === "bar"
              ? "flex max-w-40 items-center gap-1.5 text-sm font-medium text-ink"
              : "flex items-center gap-2 px-3 py-2 font-semibold text-ink"
          }
        >
          <Avatar src={profile?.avatar_url} name={name} size={variant === "bar" ? 28 : 32} />
          <span className="truncate">{name}</span>
        </span>
        <Link href="/profile" onClick={onNavigate} className={linkClass}>
          {variant === "menu" && <span aria-hidden="true">👤</span>}내 정보
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className={`${linkClass} cursor-pointer`}
        >
          {variant === "menu" && <span aria-hidden="true">👋</span>}로그아웃
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" onClick={onNavigate} className={linkClass}>
        {variant === "menu" && <span aria-hidden="true">🔑</span>}로그인
      </Link>
      <Link href="/signup" onClick={onNavigate} className={linkClass}>
        {variant === "menu" && <span aria-hidden="true">✨</span>}회원가입
      </Link>
    </>
  );
}
