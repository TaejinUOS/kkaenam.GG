import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./LegalPage.module.css";

/** 소개·이용약관·개인정보처리방침·문의처럼 긴 글로 된 안내 화면의 공통 골격. */
export function LegalPage({
  index,
  title,
  updated,
  children,
}: {
  index: string;
  title: string;
  /** 예: "2026-09-03 제정". 법적 문서가 아니면 생략한다. */
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className={`shell ${styles.screen}`}>
      <div className={styles.head}>
        <p className="section-index">{index}</p>
        <h1 className={`display ${styles.title}`}>{title}</h1>
        {updated && <p className={styles.updated}>{updated}</p>}
      </div>

      <div className={styles.body}>{children}</div>

      <Link className={`btn btn--ghost ${styles.back}`} href="/">
        상대법으로 돌아가기
      </Link>
    </div>
  );
}
