import type { Metadata } from "next";
import Link from "next/link";

import { getChampionsInPosition, positions } from "@/data/champions";
import { getWikiIndexStats } from "@/lib/wikiIndexStore";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "아직 없는 문서",
  description: "분류에는 있으나 아직 아무도 쓰지 않은 문서 목록. 무엇을 써야 하는지 알려 준다.",
};

/**
 * 아직 없는 문서 (`docs/WIKI_EXPANSION.md` "아직 없는 문서 목록").
 *
 * **빈 위키에서 값이 가장 큰 목록이다.** 빈 위키의 문제는 "무엇을 쓸지 모르겠다"인데,
 * 이 목록은 이미 있는 분류가 스스로 "이게 필요하다"고 말해 둔 것이다.
 *
 * 지금 담기는 것은 매치업 문서뿐이다. 4단계에서 `wiki_links`가 들어오면 일반 문서의
 * 빨간 링크가 여기 합쳐지고, 많이 걸린 이름부터 보이는 우선순위가 생긴다.
 */
export default async function WikiWantedPage() {
  const stats = await getWikiIndexStats();
  const written = new Set(stats.writtenMatchupKeys);

  const groups = positions.map((position) => ({
    position,
    champions: getChampionsInPosition(position.slug).filter(
      (champion) => !written.has(`${position.slug}/${champion.slug}`),
    ),
  }));

  const total = groups.reduce((sum, group) => sum + group.champions.length, 0);

  return (
    <div className={styles.screen}>
      <div className="shell">
        <nav className={styles.crumbs} aria-label="위치">
          <Link href="/wiki" className={styles.crumbLink}>
            위키
          </Link>
          <span aria-hidden="true"> · </span>
          <span>아직 없는 문서</span>
        </nav>

        <div className={styles.head}>
          <h1 className={`display ${styles.title}`}>아직 없는 문서</h1>
          <p className={`mono ${styles.total}`}>{total}</p>
        </div>
        <p className={styles.lead}>
          분류에는 있는데 아직 아무도 쓰지 않은 문서입니다. 누르면 그 문서의 빈 자리로
          갑니다 — 위키에서 빈 문서는 막다른 길이 아니라 초대입니다.
        </p>

        {total === 0 ? (
          <p className={styles.empty}>분류에 있는 문서를 전부 썼습니다.</p>
        ) : (
          <div className={styles.groups}>
            {groups.map(({ position, champions }) =>
              champions.length === 0 ? null : (
                <section key={position.slug} className={styles.group}>
                  <h2 className={styles.groupTitle}>
                    {position.name}
                    <span className={`mono ${styles.groupCount}`}>{champions.length}</span>
                  </h2>
                  <ul className={styles.chips}>
                    {champions.map((champion) => (
                      <li key={champion.slug}>
                        <Link
                          href={`/matchup/${position.slug}/${champion.slug}`}
                          className={styles.chip}
                        >
                          {champion.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
