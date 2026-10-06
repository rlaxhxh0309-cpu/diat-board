"use client";

import { usePathname } from "next/navigation";
import { AuthNav } from "./auth-nav";
import { WriteButton } from "./write-button";

const HIDDEN_ON = ["/login"];

export function HeaderNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav className="flex items-center gap-4">
      <AuthNav />
      <WriteButton />
    </nav>
  );
}
