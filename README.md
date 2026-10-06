# 다이어트 사진 게시판

다이어트 기록을 사진으로 공유하는 게시판입니다.
오늘 먹은 식단, 운동 인증, 몸의 변화를 사진과 함께 올리고 서로 좋아요와 응원 댓글로 힘을 보탤 수 있습니다.

**배포 주소:** https://diat-board.vercel.app

## 주요 기능

- **회원가입·로그인**: 이메일, 닉네임, 비밀번호로 가입하고 로그인합니다. 비밀번호를 잊었을 때 재설정 메일을 받을 수 있습니다.
- **카카오 로그인**: "카카오로 시작하기" 버튼으로 바로 시작할 수 있습니다.
- **사진 게시글 작성·수정**: 사진과 제목, 내용을 올리고, 글쓴이 본인은 글을 수정하거나 삭제할 수 있습니다.
- **좋아요**: 게시글마다 한 번씩 좋아요를 누르고 취소할 수 있습니다.
- **응원 댓글**: 게시글에 응원 댓글을 남기고, 내가 쓴 댓글은 삭제할 수 있습니다.
- **개인정보 변경**: "내 정보" 페이지에서 닉네임, 프로필 사진, 비밀번호를 바꿀 수 있습니다. 카카오로 가입한 사용자는 비밀번호 변경이 숨겨집니다.

이 밖에 게시글 목록은 한 페이지에 8개씩 나오며, **사진 보기**와 **제목 보기**를 전환할 수 있습니다.
게시글과 댓글에는 글쓴이의 닉네임과 프로필 사진이 함께 표시됩니다.

## 사용 기술

| 구분 | 기술 |
| --- | --- |
| 프레임워크 | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript |
| 스타일 | Tailwind CSS 4 |
| 백엔드 | [Supabase](https://supabase.com) (Auth, Postgres, Storage) |
| 배포 | [Vercel](https://vercel.com) |

## 로컬 실행 방법

### 1. 준비물

- Node.js 20 이상
- Supabase 프로젝트 (아래 [Supabase 설정](#supabase-설정) 참고)

### 2. 저장소 받기와 패키지 설치

```bash
git clone https://github.com/rlaxhxh0309-cpu/diat-board.git
cd diat-board
npm install
```

### 3. 환경변수 설정

프로젝트 최상위 폴더에 `.env.local` 파일을 만들고 Supabase 프로젝트 정보를 넣습니다.
값은 Supabase 대시보드의 **Project Settings → API Keys**에서 확인할 수 있습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트-ID>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable 키>
```

> `.env.local`은 `.gitignore`에 포함되어 있어 GitHub에 올라가지 않습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 배포용 빌드 |
| `npm run start` | 빌드한 결과 실행 |
| `npm run lint` | 코드 검사 |

## Supabase 설정

앱이 동작하려면 Supabase에 아래 구성이 필요합니다. 모든 테이블은 RLS가 켜져 있으며, 읽기는 누구나, 쓰기는 로그인한 본인 데이터만 가능합니다.

**테이블**

| 테이블 | 설명 |
| --- | --- |
| `posts` | 게시글 (제목, 내용, 사진 경로, 글쓴이) |
| `profiles` | 회원 프로필 (닉네임, 프로필 사진). 가입하면 트리거로 자동 생성 |
| `likes` | 좋아요. 같은 글에 같은 사람이 두 번 누를 수 없음 |
| `comments` | 응원 댓글 |

게시글을 삭제하면 그 글의 좋아요와 댓글도 함께 삭제됩니다.

**Storage 버킷 (공개)**

- `post-images`: 게시글 사진
- `profile-images`: 프로필 사진 (사용자별 폴더)

**Authentication**

- **Providers**에서 Email과 Kakao를 켭니다. 카카오는 [Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 REST API 키와 Client Secret을 입력합니다.
- **URL Configuration**의 Redirect URLs에 로그인 후 돌아올 주소를 추가합니다.
  - `http://localhost:3000/auth/callback`
  - `https://diat-board.vercel.app/auth/callback`

## 폴더 구조

```
app/
├─ page.tsx              랜딩 페이지 (서비스 소개, 최근 게시글)
├─ board/                게시글 목록 (페이지네이션, 사진/제목 보기)
├─ write/                글쓰기
├─ posts/[id]/           게시글 상세, 좋아요·댓글, 수정(edit/)
├─ profile/              내 정보 (개인정보 변경)
├─ login/ signup/        로그인, 회원가입
├─ forgot-password/      비밀번호 찾기
├─ reset-password/       비밀번호 재설정
└─ auth/callback/        카카오 로그인·메일 인증 처리
utils/
├─ supabase/             Supabase 클라이언트 (브라우저·서버·미들웨어)
├─ posts.ts              게시글 타입과 공통 함수
└─ profile.ts            프로필 타입과 공통 함수
```

## 배포

Vercel에 GitHub 저장소를 연결하면 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.
Vercel 프로젝트의 **Settings → Environment Variables**에 위 환경변수 두 개를 똑같이 넣어야 합니다.
