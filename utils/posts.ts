import type { Author } from "@/utils/profile";

export const POST_IMAGES_BUCKET = "post-images";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 다이어트 단계 (DB posts.category의 check 제약과 같은 값)
export const CATEGORIES = [
  { value: "start", label: "시작했어요", emoji: "🌱" },
  { value: "progress", label: "진행 중이에요", emoji: "🔥" },
  { value: "success", label: "해냈어요", emoji: "🏆" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const isCategory = (value: unknown): value is Category =>
  CATEGORIES.some((c) => c.value === value);

export const categoryInfo = (value: Category) => CATEGORIES.find((c) => c.value === value)!;

export type Post = {
  id: string;
  title: string;
  content: string;
  image_path: string;
  created_at: string;
  user_id: string | null;
  category: Category;
};

export type Comment = {
  id: number;
  user_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string | null;
  profiles: Author;
};

export const COMMENT_SELECT = "id, user_id, parent_id, content, created_at, updated_at, profiles(nickname, avatar_url)";

export const imageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${path}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
