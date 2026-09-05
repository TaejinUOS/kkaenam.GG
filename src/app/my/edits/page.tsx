import type { Metadata } from "next";
import Link from "next/link";

import { requirePageUser } from "@/lib/authGuard";
import { docHref, docSectionLabel, docTitle } from "@/lib/wikiDocTarget";
import { listMyEdits } from "@/lib/wikiEditStore";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "내 편집" };

const STATUS_LABEL: Record<string, string> = {
  pending: "검토 대기",
  accepted: "반영됨",
  rejected: "거절됨",
  withdrawn: "철회됨",
};

/** 내가 제출한 편집 제안의 처리 상태 (FR-33). */
export default async function MyEditsPage() {
  const viewer = await requirePageUser();
  const edits = await listMyEdits(viewer.id);

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">내 편집</p>
      <h1 className={`display ${styles.title}`}>내 편집</h1>

      {edits.length === 0 ? (
        <p className={styles.empty}>아직 제출한 편집이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {edits.map((edit) => {
            /*
             * 거절된 새 문서 제안은 이름을 놓아준 껍데기라 갈 곳이 없다. 링크를 걸면
             * "아직 없는 문서" 화면으로 데려가 제안이 살아 있는 것처럼 보인다.
             */
            const gone = edit.target.kind === "article" && edit.target.status === "rejected";
            const label = `${docTitle(edit.target)} · ${docSectionLabel(edit.target, edit.meSlug)}`;

            return (
              <li key={edit.id} className={styles.row}>
                <div className={styles.rowHead}>
                  <span
                    className={`sticker ${edit.status === "accepted" ? "sticker--acid" : edit.status === "pending" ? "sticker--gum" : ""}`}
                  >
                    {STATUS_LABEL[edit.status] ?? edit.status}
                  </span>
                  {gone ? (
                    <span className={styles.target}>{label}</span>
                  ) : (
                    <Link href={docHref(edit.target)} className={styles.target}>
                      {label}
                    </Link>
                  )}
                </div>
                {edit.summary && <p className={styles.summary}>{edit.summary}</p>}
                {edit.status === "rejected" && edit.reviewNote && (
                  <p className={styles.reviewNote}>운영자 사유: {edit.reviewNote}</p>
                )}
                <p className="mono">{formatDate(edit.createdAt)} 제출</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
