"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/app/toast";

export const GUEST_WRITE_MESSAGE = "비회원은 글을 쓸 수 없습니다";

export function WriteButton() {
  const router = useRouter();
  const pathname = usePathname();
  const showToast = useToast();

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      showToast(GUEST_WRITE_MESSAGE);
      if (pathname !== "/login") router.push("/login");
      return;
    }
    router.push("/write");
  };

  return (
    <Link
      href="/write"
      onClick={onClick}
      className="btn-primary px-3.5 py-2 text-sm sm:px-4"
    >
      글쓰기
    </Link>
  );
}
