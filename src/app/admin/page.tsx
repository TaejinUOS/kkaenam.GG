import type { Metadata } from "next";
import Link from "next/link";

import { requirePageAdmin } from "@/lib/authGuard";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "관리자" };

export default async function AdminHomePage() {
  await requirePageAdmin();

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">관리자</p>
      <h1 className={`display ${styles.title}`}>관리자</h1>

      <div className={styles.links}>
        <Link href="/admin/wiki/review" className={`btn btn--acid ${styles.link}`}>
          검토 대기열
        </Link>
        <Link href="/admin/wiki/recent" className={`btn ${styles.link}`}>
          최근 변경
        </Link>
        <Link href="/admin/taxonomy" className={`btn ${styles.link}`}>
          분류 편집
        </Link>
      </div>
    </div>
  );
}
