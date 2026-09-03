import Link from "next/link";

import { PATCH, SYNCED_AT } from "@/data/champions";

import styles from "./SiteFooter.module.css";

const SITE_LINKS = [
  { label: "소개", href: "/about" },
  { label: "이용약관", href: "/terms" },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "문의", href: "/contact" },
];

/** 마지막 Data Dragon 갱신일 표시 (PRD 14 "패치 갱신 절차와 마지막 갱신일을 표시한다"). */
function formatSyncedAt(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`shell ${styles.inner}`}>
        <p className={`mono ${styles.meta}`}>
          <span className="sticker sticker--cobalt">patch {PATCH}</span>
          <span>스킬 데이터 갱신 {formatSyncedAt(SYNCED_AT)}</span>
        </p>

        <nav className={styles.links} aria-label="사이트 정보">
          <ul className={styles.linkList}>
            {SITE_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* PRD 16: Riot 정책에 따른 비공식 프로젝트 고지. */}
        <p className={styles.legal}>
          깨남.COM는 Riot Games가 승인하거나 후원하지 않은 비공식 프로젝트입니다. League of Legends와
          관련 자산은 Riot Games, Inc.의 자산이며, 챔피언 이미지와 스킬 정보는 Riot Games의 Data
          Dragon을 사용합니다.
        </p>
      </div>
    </footer>
  );
}
