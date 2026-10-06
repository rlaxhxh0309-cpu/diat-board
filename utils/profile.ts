import type { SupabaseClient, User } from "@supabase/supabase-js";

export const PROFILE_IMAGES_BUCKET = "profile-images";
// 내 정보 페이지에서 저장하면 상단바가 다시 불러오도록 알린다
export const PROFILE_UPDATED_EVENT = "profile-updated";

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 10;

export type Profile = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

// 게시글·댓글에 함께 조회되는 작성자 정보
export type Author = { nickname: string | null; avatar_url: string | null } | null;

export const emailPrefix = (email?: string | null) => email?.split("@")[0] || "회원";

export const displayName = (nickname?: string | null, email?: string | null) =>
  nickname?.trim() || emailPrefix(email);

export const isKakaoUser = (user: User) => user.app_metadata?.provider === "kakao";

// 가입 트리거가 프로필을 만들지만, 없으면 여기서 만든다
export async function getOrCreateProfile(supabase: SupabaseClient, user: User) {
  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (data) return data;

  const meta = user.user_metadata ?? {};
  const nickname = String(
    meta.name || meta.full_name || meta.nickname || emailPrefix(user.email),
  ).slice(0, NICKNAME_MAX);
  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: user.id, nickname })
    .select("id, nickname, avatar_url")
    .single<Profile>();
  return created ?? null;
}
