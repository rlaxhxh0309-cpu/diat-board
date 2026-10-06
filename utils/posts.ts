import type { Author } from "@/utils/profile";

export const POST_IMAGES_BUCKET = "post-images";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Post = {
  id: string;
  title: string;
  content: string;
  image_path: string;
  created_at: string;
  user_id: string | null;
};

export type Comment = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Author;
};

export const COMMENT_SELECT = "id, user_id, content, created_at, profiles(nickname, avatar_url)";

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
