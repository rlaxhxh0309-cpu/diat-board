export const POST_IMAGES_BUCKET = "post-images";

export type Post = {
  id: string;
  title: string;
  content: string;
  image_path: string;
  created_at: string;
};

export const imageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${path}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
