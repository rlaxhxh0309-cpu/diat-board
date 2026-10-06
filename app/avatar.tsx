import Image from "next/image";

// 프로필 사진이 없으면 닉네임 첫 글자를 보여준다
export function Avatar({ src, name, size = 24 }: { src?: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full bg-neutral-100 object-cover dark:bg-neutral-900"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
