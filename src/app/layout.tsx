import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nanum_Pen_Script } from "next/font/google";
import localFont from "next/font/local";

import { AuthStatus } from "@/components/AuthStatus";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ZineFilters } from "@/components/ZineFilters";

import "./globals.css";

/**
 * 블루프린트 4장 Display: 챔피언명과 짧은 메인 카피 전용.
 *
 * SB 어그로체 B (샌드박스네트워크). 목업의 두껍고 각진 제목 글자에 가장 가까우면서
 * 웹사이트와 임베딩(서버 내 폰트 탑재)이 모두 허용된 서체다.
 * 라이선스가 폰트 파일의 수정·복제·배포를 금지하므로 **서브셋하지 않고 원본 그대로** 담는다.
 * https://noonnu.cc/font_page/738
 */
const displayFace = localFont({
  src: "./fonts/SBAggroB.woff",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display-face",
  /* 폰트가 로드되기 전 대체 서체와의 크기 차이로 생기는 레이아웃 이동을 줄인다. */
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "sans-serif"],
});

/** 블루프린트 4장 수치·메타데이터: 쿨타임, 좋아요 수, 작성일, 랭킹 번호. */
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-plex",
});

/**
 * 마스트헤드 콜라주의 손글씨 메모 · 도장 전용.
 *
 * 나눔손글씨 펜 (네이버, OFL). 볼펜으로 급히 적은 획이라 어그로체의 두꺼운 제목 글자와
 * 대비되고, 옆에 붙은 찢은 종이·도장과 결이 맞는다. 굵기는 400 하나뿐이다.
 */
const handFace = Nanum_Pen_Script({
  weight: "400",
  /*
   * `subsets`를 지정하면 next/font가 그 슬라이스의 @font-face만 남기는데, 이 버전의
   * 폰트 메타데이터에는 korean 슬라이스가 없어 한글이 통째로 빠진다. 목록을 비워
   * 구글이 주는 unicode-range 전체를 그대로 받고, 대신 preload를 끈다
   * (한글 본문이 아니라 배지 두 장에만 쓰는 서체라 선행 로드할 이유도 없다).
   */
  preload: false,
  display: "swap",
  variable: "--font-hand-face",
});

export const metadata: Metadata = {
  /*
   * 공유 링크와 검색 엔진이 쓰는 절대 URL의 기준. 없으면 Open Graph 이미지와
   * canonical이 상대 경로로 나가 카카오톡·디스코드 미리보기가 깨진다.
   */
  metadataBase: new URL("https://kkaenam.com"),
  title: {
    default: "깨남.COM — 누굴 상대해?",
    template: "%s | 깨남.COM",
  },
  description:
    "포지션별로 상대 챔피언을 고르고, 보편 상대법 공통과 내 챔피언 전용 상대법 Me를 함께 보는 리그 오브 레전드 상대법 위키.",
};

export const viewport: Viewport = {
  themeColor: "#101014",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${displayFace.variable} ${plexMono.variable} ${handFace.variable}`}>
      <head>
        {/*
          블루프린트 4장이 지정한 본문 서체. Pretendard는 Google Fonts에 없어 배포 CDN의
          동적 서브셋을 사용한다. 실서비스 전 라이선스 확인 항목은 블루프린트 10장에 있다.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body style={{ ["--font-pretendard" as string]: "'Pretendard Variable'" }}>
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        <ZineFilters />
        <SiteHeader>
          <AuthStatus />
        </SiteHeader>
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
