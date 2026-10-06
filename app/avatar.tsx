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
        className="shrink-0 rounded-full bg-page object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
