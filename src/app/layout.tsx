import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, IBM_Plex_Mono } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

/** 블루프린트 4장 Display: 챔피언명과 짧은 메인 카피 전용. */
const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bagel",
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
    <html lang="ko" className={`${bagel.variable} ${plexMono.variable}`}>
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
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
