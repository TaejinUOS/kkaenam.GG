import type { Metadata } from "next";
import Link from "next/link";

import { allChampions } from "@/data/champions";
import { getTaxonomy } from "@/lib/taxonomyStore";
import { articleHref } from "@/lib/wikiTitle";
import { getWantedArticles, getWikiIndexStats } from "@/lib/wikiIndexStore";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "아직 없는 문서",
  description: "분류에는 있으나 아직 아무도 쓰지 않은 문서, 링크로 걸렸지만 없는 문서 목록.",
};

/**
 * 아직 없는 문서 (`docs/WIKI_EXPANSION.md` "아직 없는 문서 목록").
 *
 * **빈 위키에서 값이 가장 큰 목록이다.** 빈 위키의 문제는 "무엇을 쓸지 모르겠다"인데,
 * 이 목록은 이미 있는 분류·이미 쓰인 문서가 스스로 "이게 필요하다"고 말해 둔 것이다.
 *
 * 두 갈래를 함께 보여 준다.
 * - 매치업 문서: 분류에는 있으나 아직 아무도 안 쓴 챔피언. 챔피언당 한 줄이다
 *   (문서가 챔피언당 하나이므로 — 마이그레이션 0003).
 * - 일반 문서: 어딘가에서 `[[…]]`로 걸렸지만 아직 없는 이름. 많이 걸린 이름부터
 *   보인다 — `wiki_links`(4단계)가 그 우선순위의 근거다.
 */
export default async function WikiWantedPage() {
  const [stats, taxonomy, wantedArticles] = await Promise.all([
    getWikiIndexStats(),
    getTaxonomy(),
    getWantedArticles(500),
  ]);
  const written = new Set(stats.writtenChampionSlugs);

  const wantedChampions = allChampions
    .map((champion) => ({
      champion,
      where: taxonomy.placementsOf(champion.slug).map((p) => p.position.name),
    }))
    .filter(({ champion, where }) => where.length > 0 && !written.has(champion.slug));

  const total = wantedChampions.length + wantedArticles.length;

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
          분류에는 있는데 아직 아무도 쓰지 않은 문서, 그리고 다른 문서가 링크로 부르고
          있지만 아직 없는 문서입니다. 누르면 그 문서의 빈 자리로 갑니다 — 위키에서 빈
          문서는 막다른 길이 아니라 초대입니다.
        </p>

        {total === 0 ? (
          <p className={styles.empty}>분류에 있는 문서를 전부 썼고, 걸린 링크도 전부 채워졌습니다.</p>
        ) : (
          <div className={styles.groups}>
            {wantedArticles.length > 0 && (
              <section className={styles.group} aria-labelledby="wanted-articles">
                <h2 className={styles.groupTitle} id="wanted-articles">
                  일반 문서
                  <span className={`mono ${styles.groupCount}`}>{wantedArticles.length}</span>
                </h2>
                <ul className={styles.chips}>
                  {wantedArticles.map((article) => (
                    <li key={article.titleKey}>
                      <Link href={articleHref(article.title)} className={styles.chip}>
                        <span className={styles.chipName}>{article.title}</span>
                        <span className={`mono ${styles.chipWhere}`}>
                          {article.linkCount}개 문서에서 링크
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {wantedChampions.length > 0 && (
              <section className={styles.group} aria-labelledby="wanted-matchups">
                <h2 className={styles.groupTitle} id="wanted-matchups">
                  매치업 문서
                  <span className={`mono ${styles.groupCount}`}>{wantedChampions.length}</span>
                </h2>
                <ul className={styles.chips}>
                  {wantedChampions.map(({ champion, where }) => (
                    <li key={champion.slug}>
                      <Link href={`/matchup/${champion.slug}`} className={styles.chip}>
                        <span className={styles.chipName}>{champion.name} 상대법</span>
                        <span className={`mono ${styles.chipWhere}`}>{where.join(" · ")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
