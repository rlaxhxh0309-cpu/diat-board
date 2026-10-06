import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// 이메일 링크·소셜 로그인(PKCE)의 code를 세션으로 교환한 뒤 next 경로로 보낸다
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  // 외부 주소로의 오픈 리다이렉트 방지
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = createClient(await cookies());
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (next === "/reset-password") {
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`);
  }

  // 소셜 로그인 실패: 사용자가 동의를 취소했으면 access_denied가 온다
  const reason = searchParams.get("error") === "access_denied" ? "oauth_cancelled" : "oauth_failed";
  return NextResponse.redirect(`${origin}/login?error=${reason}`);
}
