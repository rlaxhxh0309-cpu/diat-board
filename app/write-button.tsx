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
      className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300"
    >
      글쓰기
    </Link>
  );
}
