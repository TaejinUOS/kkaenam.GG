import type { Metadata } from "next";
import Link from "next/link";

import { getChampionBySlug, getPosition } from "@/data/champions";
import { requirePageAdmin } from "@/lib/authGuard";
import { listRecentChanges } from "@/lib/wikiEditStore";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "최근 변경" };

const ACCEPTED_VIA_LABEL: Record<string, string> = {
  empty_section: "무검토 게시",
  review: "검토 승인",
  admin: "관리자",
};

/**
 * 최근 반영된 편집 피드 (FR-31). 즉시 반영(`empty_section`) 항목을 눈에 띄게 구분한다 —
 * 검토 없이 게시된 것이라 운영자가 훑어봐야 하는 항목이다 (WIKI_MODEL.md "즉시 반영의 대가").
 */
export default async function RecentChangesPage() {
  await requirePageAdmin();
  const changes = await listRecentChanges();

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">관리자</p>
      <h1 className={`display ${styles.title}`}>최근 변경</h1>

      {changes.length === 0 ? (
        <p className={styles.empty}>아직 반영된 편집이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {changes.map((change) => {
            const position = getPosition(change.positionSlug);
            const champion = getChampionBySlug(change.championSlug);
            const sectionLabel = change.meSlug
              ? (getChampionBySlug(change.meSlug)?.name ?? change.meSlug)
              : "공통";
            const unreviewed = change.acceptedVia === "empty_section";

            return (
              <li key={change.id} className={`${styles.row} ${unreviewed ? styles.rowUnreviewed : ""}`}>
                <div className={styles.rowHead}>
                  <span className={`sticker ${unreviewed ? "sticker--gum" : "sticker--acid"}`}>
                    {ACCEPTED_VIA_LABEL[change.acceptedVia] ?? change.acceptedVia}
                  </span>
                  <span className="mono">r{change.revision}</span>
                  {position && champion ? (
                    <Link
                      href={`/matchup/${position.slug}/${champion.slug}${change.meSlug ? `?me=${change.meSlug}` : ""}`}
                      className={styles.target}
                    >
                      {position.name} · {champion.name} · {sectionLabel}
                    </Link>
                  ) : (
                    <span className={styles.target}>
                      {change.positionSlug} · {change.championSlug} · {sectionLabel}
                    </span>
                  )}
                </div>
                {change.summary && <p className={styles.summary}>{change.summary}</p>}
                <p className="mono">
                  {change.authorName ?? "탈퇴 계정"} · {formatDate(change.createdAt)}
                </p>
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
