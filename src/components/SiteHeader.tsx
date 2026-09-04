"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import styles from "./SiteHeader.module.css";

type NavItem = {
  label: string;
  href: string;
  /** MVP에서 `추후 개발` 안내 화면으로 이동하는 메뉴 (PRD 5.7). */
  soon?: boolean;
  /** 현재 위치로 볼 추가 경로 접두사. */
  match?: string;
};

const NAV: NavItem[] = [
  { label: "상대법", href: "/", match: "/matchup" },
  /*
   * 이 사이트에서 위키는 곁다리가 아니라 본체이므로 `soon` 딱지가 붙은 메뉴들보다
   * 앞선다 (`docs/WIKI_EXPANSION.md` "위키 메뉴").
   */
  { label: "위키", href: "/wiki" },
  { label: "전적", href: "/records", soon: true },
  { label: "통계", href: "/stats", soon: true },
  { label: "티어표", href: "/tier-list", soon: true },
  { label: "강의", href: "/lessons", soon: true },
];

const MY_PAGE: NavItem = { label: "마이페이지", href: "/my", soon: true };

function isCurrent(pathname: string, item: NavItem) {
  if (item.href === "/") {
    return pathname === "/" || (item.match ? pathname.startsWith(item.match) : false);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SiteHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  // 블루프린트 6.1: 메뉴 hover 시 페이지를 흐리게 하지 않고 콘텐츠에 옅은 잉크를 덮는다.
  const [navHovered, setNavHovered] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={`shell ${styles.bar}`}>
          <Link href="/" className={styles.logo} aria-label="깨남.COM 홈">
            <span className={`display ${styles.logoMark}`}>깨남</span>
            <span className={`display ${styles.logoSuffix}`}>.COM</span>
          </Link>

          <nav
            className={styles.nav}
            aria-label="주 메뉴"
            onMouseEnter={() => setNavHovered(true)}
            onMouseLeave={() => setNavHovered(false)}
          >
            <ul className={styles.navList}>
              {NAV.map((item) => {
                const current = isCurrent(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${current ? styles.navLinkCurrent : ""}`}
                      aria-current={current ? "page" : undefined}
                    >
                      {item.label}
                      {item.soon && (
                        <span className={`sticker sticker--soon ${styles.soon}`} aria-hidden="true">
                          soon
                        </span>
                      )}
                      {item.soon && <span className="sr-only">(추후 개발)</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link
            href={MY_PAGE.href}
            className={`${styles.navLink} ${styles.myPage} ${
              isCurrent(pathname, MY_PAGE) ? styles.navLinkCurrent : ""
            }`}
            aria-current={isCurrent(pathname, MY_PAGE) ? "page" : undefined}
          >
            <span className={styles.avatar} aria-hidden="true" />
            {/* 좁은 화면에서 숨길 수 있도록 레이블을 감싼다. 아바타만 남는다. */}
            <span className={styles.myPageLabel}>{MY_PAGE.label}</span>
            <span className="sr-only">(추후 개발)</span>
          </Link>

          {children}
        </div>
      </header>

      <div
        className={`${styles.dim} ${navHovered ? styles.dimOn : ""}`}
        aria-hidden="true"
        data-testid="nav-dim"
      />
    </>
  );
}
