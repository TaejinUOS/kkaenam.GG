import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";

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

export const metadata: Metadata = {
  title: {
    default: "깨남.GG — 누굴 상대해?",
    template: "%s | 깨남.GG",
  },
  description:
    "포지션별로 상대 챔피언을 고르고, 보편 상대법 General과 내 챔피언 전용 상대법 Me를 함께 보는 리그 오브 레전드 상대법 커뮤니티.",
};

export const viewport: Viewport = {
  themeColor: "#101014",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${displayFace.variable} ${plexMono.variable}`}>
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
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
