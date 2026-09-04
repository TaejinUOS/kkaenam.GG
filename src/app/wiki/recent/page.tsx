import type { Metadata } from "next";
import Link from "next/link";

import { getChampionBySlug } from "@/data/champions";
import { relativeTime } from "@/lib/relativeTime";
import { matchupDocTitle } from "@/lib/wikiLink";
import { listRecentChanges } from "@/lib/wikiEditStore";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "최근 바뀐 문서",
  description: "깨남.COM 위키에서 최근에 바뀐 문서를 시간순으로 본다.",
};

const FEED_LIMIT = 50;

/**
 * 공개 최근 변경 피드 (`docs/WIKI_EXPANSION.md` "위키 메뉴").
 *
 * 관리자용 `/admin/wiki/recent`와 같은 조회를 쓰지만 목적이 다르다. 그쪽은 "무검토
 * 게시를 걸러 훑어보는" 감사 도구라 승인 경로를 눈에 띄게 만들고, 이쪽은 **이 위키가
 * 살아 있다는 것을 보여 주는 지면**이라 문서와 시각이 주인공이다.
 */
export default async function WikiRecentPage() {
  const changes = await listRecentChanges(FEED_LIMIT);
  const now = Date.now();

  return (
    <div className={styles.screen}>
      <div className="shell">
        <nav className={styles.crumbs} aria-label="위치">
          <Link href="/wiki" className={styles.crumbLink}>
            위키
          </Link>
          <span aria-hidden="true"> · </span>
          <span>최근 바뀐 문서</span>
        </nav>

        <h1 className={`display ${styles.title}`}>최근 바뀐 문서</h1>
        <p className={styles.lead}>매치업 문서와 일반 문서를 시간순으로 함께 보여 줍니다.</p>

        {changes.length === 0 ? (
          <p className={styles.empty}>아직 반영된 편집이 없습니다. 첫 편집이 여기 남습니다.</p>
        ) : (
          <ul className={styles.list}>
            {changes.map((change) => {
              const champion = getChampionBySlug(change.championSlug);
              const title = matchupDocTitle(champion?.name ?? change.championSlug);
              const section = change.meSlug
                ? (getChampionBySlug(change.meSlug)?.name ?? change.meSlug)
                : null;

              return (
                <li key={change.id}>
                  <Link
                    href={`/matchup/${change.championSlug}${
                      change.meSlug ? `?me=${change.meSlug}` : ""
                    }`}
                    className={styles.row}
                  >
                    <time className={`mono ${styles.when}`} dateTime={change.createdAt}>
                      {relativeTime(change.createdAt, now)}
                    </time>

                    <span className={styles.body}>
                      <span className={styles.docTitle}>
                        {title}
                        {section && <span className={styles.section}> › {section}</span>}
                      </span>
                      {/* 편집 요약은 선택 입력이라 비어 있을 수 있다. */}
                      {change.summary && <span className={styles.summary}>{change.summary}</span>}
                    </span>

                    <span className={`mono ${styles.meta}`}>
                      <span className={styles.revision}>r{change.revision}</span>
                      <span className={styles.author}>{change.authorName ?? "탈퇴 계정"}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
