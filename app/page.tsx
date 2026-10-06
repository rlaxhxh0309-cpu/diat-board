import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { pageMetadata, SITE_NAME } from "@/utils/metadata";
import { PhotoGrid, POST_LIST_SELECT, type PostListItem } from "@/app/post-cards";
import heroImage from "@/public/images/AdobeStock_519895333.jpeg";

const HEADLINE = "혼자 하면 힘든 다이어트, 같이 기록해요";
const SUBHEADLINE = "오늘 먹은 식단과 운동, 몸의 변화를 사진으로 남기고 서로 응원하며 끝까지 함께해요.";

export const metadata: Metadata = {
  ...pageMetadata({ title: HEADLINE, description: SUBHEADLINE, path: "/" }),
  // 첫 화면은 템플릿("… | 사이트명") 대신 사이트명이 앞에 오도록
  title: { absolute: `${SITE_NAME} - ${HEADLINE}` },
};

const FEATURES = [
  {
    emoji: "📸",
    title: "사진으로 기록하기",
    description: "식단, 운동 인증, 거울 셀카까지. 글보다 사진 한 장이 오늘의 노력을 더 잘 보여줘요.",
  },
  {
    emoji: "💚",
    title: "서로 응원하기",
    description: "좋아요와 응원 댓글로 힘을 주고받아요. 누군가 지켜봐 준다는 게 꾸준함의 비결이에요.",
  },
  {
    emoji: "📈",
    title: "내 변화 모아보기",
    description: "차곡차곡 쌓인 기록을 돌아보면, 어제보다 나아진 내 모습이 한눈에 보여요.",
  },
];

const STEPS = [
  { emoji: "✍️", title: "가입하기", description: "이메일이나 카카오 계정으로 10초 만에 시작해요." },
  { emoji: "📷", title: "사진 올리기", description: "오늘의 식단이나 운동 사진을 한 장 올려요." },
  { emoji: "🎉", title: "응원 받기", description: "다른 사람들의 좋아요와 응원 댓글이 도착해요." },
];

const RECENT_COUNT = 6;

export default async function Page() {
  const supabase = createClient(await cookies());
  const [
    {
      data: { user },
    },
    { data: recentPosts },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(POST_LIST_SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(RECENT_COUNT)
      .overrideTypes<PostListItem[], { merge: false }>(),
  ]);
  const loggedIn = !!user;

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. 메인 영역 */}
      <section className="pt-2 text-center sm:pt-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
          🌱 다이어트 사진 게시판
        </p>
        <h1 className="mx-auto mt-5 max-w-2xl text-3xl leading-tight font-bold tracking-tight break-keep sm:text-5xl">
          혼자 하면 힘든 다이어트,
          <br />
          <span className="text-brand">같이 기록해요</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted break-keep sm:text-lg">{SUBHEADLINE}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {loggedIn ? (
            <>
              <Link href="/write" className="btn-primary px-7">
                글쓰기
              </Link>
              <Link href="/board" className="btn-secondary px-7">
                게시판 가기
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn-primary px-7">
                지금 시작하기
              </Link>
              <Link href="/board" className="btn-secondary px-7">
                게시판 구경하기
              </Link>
            </>
          )}
        </div>

        <div className="card relative mt-10 overflow-hidden">
          <Image
            src={heroImage}
            alt="다이어트 전과 후의 모습을 나란히 보여주는 사진"
            placeholder="blur"
            sizes="(min-width: 1024px) 992px, 100vw"
            className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
            preload
          />
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-card sm:bottom-5 sm:left-5 sm:text-sm">
            기록 1일차
          </span>
          <span className="absolute right-3 bottom-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-card sm:right-5 sm:bottom-5 sm:text-sm">
            기록 100일차 🎉
          </span>
        </div>
      </section>

      {/* 2. 서비스 소개 */}
      <section>
        <SectionTitle eyebrow="서비스 소개" title="기록하고, 응원하고, 변화를 확인해요" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {FEATURES.map((f) => (
            <li key={f.title} className="card p-6 sm:p-7">
              <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-3xl">
                {f.emoji}
              </span>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted break-keep">{f.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. 이용 방법 */}
      <section>
        <SectionTitle eyebrow="이용 방법" title="세 단계면 충분해요" />
        <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card flex items-start gap-4 p-5 sm:flex-col sm:p-7">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold">
                  <span aria-hidden="true">{s.emoji} </span>
                  {s.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted break-keep">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. 최근 게시글 미리보기 */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <SectionTitle eyebrow="최근 기록" title="지금 올라온 다이어트 기록" align="left" />
          <Link href="/board" className="shrink-0 text-sm font-semibold text-brand hover:underline">
            더 보기 →
          </Link>
        </div>
        <div className="mt-8">
          {recentPosts?.length ? (
            <PhotoGrid posts={recentPosts} gridClassName="grid-cols-2 sm:grid-cols-3" />
          ) : (
            <div className="card flex flex-col items-center px-6 py-14 text-center text-muted">
              <span aria-hidden="true" className="text-4xl">🥗</span>
              <p className="mt-3">아직 올라온 기록이 없어요. 첫 기록의 주인공이 되어 보세요!</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. 마지막 영역 */}
      <section className="rounded-2xl bg-brand px-6 py-14 text-center text-white sm:py-20">
        <p aria-hidden="true" className="text-4xl">💪</p>
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">오늘부터 기록해볼까요?</h2>
        <p className="mt-3 text-white/85 break-keep">첫 사진 한 장이 변화의 시작이에요.</p>
        <Link
          href={loggedIn ? "/write" : "/signup"}
          className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3 font-semibold text-brand shadow-card transition hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        >
          {loggedIn ? "오늘의 기록 올리기" : "무료로 시작하기"}
        </Link>
      </section>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="text-sm font-semibold text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold break-keep sm:text-3xl">{title}</h2>
    </div>
  );
}
