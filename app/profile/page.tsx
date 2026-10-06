"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError, User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";
import { Avatar } from "@/app/avatar";
import {
  displayName,
  getOrCreateProfile,
  isKakaoUser,
  NICKNAME_MAX,
  NICKNAME_MIN,
  PROFILE_IMAGES_BUCKET,
  PROFILE_UPDATED_EVENT,
  type Profile,
} from "@/utils/profile";

const MAX_SIZE = 5 * 1024 * 1024;

const PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  weak_password: "비밀번호가 너무 약합니다. 6자 이상으로 입력해 주세요.",
  same_password: "기존 비밀번호와 다른 비밀번호를 입력해 주세요.",
  reauthentication_needed: "보안을 위해 다시 로그인한 뒤 변경해 주세요.",
  over_request_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
};

const toPasswordMessage = (error: AuthError) =>
  (error.code && PASSWORD_ERROR_MESSAGES[error.code]) ||
  "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.";

// 공개 URL에서 버킷 안의 경로를 꺼낸다 (예전 사진 삭제용)
const storagePath = (url: string | null) => {
  const marker = `/${PROFILE_IMAGES_BUCKET}/`;
  return url?.includes(marker) ? url.slice(url.indexOf(marker) + marker.length) : null;
};

export default function ProfilePage() {
  const router = useRouter();
  const showToast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // 로그인한 사용자만 들어올 수 있다
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      if (!user) {
        showToast("로그인 후 이용할 수 있습니다");
        router.replace("/login");
        return;
      }
      const p = await getOrCreateProfile(supabase, user);
      if (cancelled) return;
      if (!p) showToast("내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setUser(user);
      setProfile(p);
      setNickname(p?.nickname ?? "");
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

  if (!user) return null;

  const trimmedNickname = nickname.trim();
  const profileChanged = trimmedNickname !== (profile?.nickname ?? "") || !!file;
  const canSaveProfile = !!profile && !!trimmedNickname && profileChanged && !savingProfile;
  const passwordMismatch = !!passwordConfirm && password !== passwordConfirm;
  const canSavePassword = !!password && !!passwordConfirm && !passwordMismatch && !savingPassword;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    if (selected.size > MAX_SIZE) {
      showToast("프로필 사진은 5MB 이하만 업로드할 수 있습니다.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSaveProfile || !profile) return;
    if (trimmedNickname.length < NICKNAME_MIN || trimmedNickname.length > NICKNAME_MAX) {
      showToast(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해 주세요.`);
      return;
    }
    setSavingProfile(true);
    const supabase = createClient();

    let avatarUrl = profile.avatar_url;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_IMAGES_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        showToast("프로필 사진 업로드에 실패했습니다. 다시 시도해 주세요.");
        setSavingProfile(false);
        return;
      }
      avatarUrl = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ nickname: trimmedNickname, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id, nickname, avatar_url")
      .single<Profile>();

    if (error || !data) {
      showToast("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setSavingProfile(false);
      return;
    }

    // 예전 사진은 정리한다 (실패해도 저장 결과에는 영향 없음)
    const oldPath = file ? storagePath(profile.avatar_url) : null;
    if (oldPath) supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([oldPath]);

    setProfile(data);
    setNickname(data.nickname);
    setFile(null);
    setPreview(null);
    setSavingProfile(false);
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    showToast("저장되었습니다", "success");
    router.refresh();
  };

  const onSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSavePassword) return;
    setSavingPassword(true);
    const { error } = await createClient().auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      showToast(toPasswordMessage(error));
      return;
    }
    setPassword("");
    setPasswordConfirm("");
    showToast("저장되었습니다", "success");
  };

  const name = displayName(trimmedNickname || profile?.nickname, user.email);

  return (
    <div className="mx-auto max-w-md space-y-5 sm:mt-4">
      <form onSubmit={onSaveProfile} noValidate className="card space-y-5 p-6 sm:p-8">
        <h1 className="text-2xl font-bold">내 정보</h1>

        <div className="flex flex-col items-center gap-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기
            <img src={preview} alt="미리보기" className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-soft" />
          ) : (
            <Avatar src={profile?.avatar_url} name={name} size={96} />
          )}
          <label className="btn-secondary px-4 py-2 text-sm">
            {preview ? "다른 사진 선택" : "프로필 사진 변경"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onFileChange}
              className="sr-only"
            />
          </label>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">
            이메일
          </label>
          <input
            id="email"
            value={user.email ?? ""}
            readOnly
            disabled
            className="input-field cursor-not-allowed bg-page text-muted"
          />
        </div>

        <div>
          <label htmlFor="nickname" className="mb-2 block text-sm font-semibold">
            닉네임
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={NICKNAME_MAX}
            placeholder={`${NICKNAME_MIN}~${NICKNAME_MAX}자`}
            className="input-field"
          />
        </div>

        <button type="submit" disabled={!canSaveProfile} className="btn-primary w-full">
          {savingProfile ? "저장 중..." : "저장"}
        </button>
      </form>

      <section className="card space-y-5 p-6 sm:p-8">
        <h2 className="text-lg font-bold">비밀번호 변경</h2>
        {isKakaoUser(user) ? (
          <p className="rounded-2xl bg-[#FEE500]/25 px-4 py-3 text-sm text-ink">
            카카오 계정으로 로그인 중이에요
          </p>
        ) : (
          <form onSubmit={onSavePassword} noValidate className="space-y-5">
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
                비밀번호 확인
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
              {passwordMismatch && (
                <p className="mt-2 text-sm text-red-600">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
            <button type="submit" disabled={!canSavePassword} className="btn-primary w-full">
              {savingPassword ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
