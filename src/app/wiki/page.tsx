import type { Metadata } from "next";
import { Suspense } from "react";

import { WikiIndexScreen, type RecentRow, type WorkCounter } from "@/components/wiki/WikiIndexScreen";
import { buildWikiIndexData, classifiedChampionSlugs } from "@/data/wikiIndex";
import { coverPortals, shelfPortals } from "@/data/portals";
import { relativeTime } from "@/lib/relativeTime";
import { getTaxonomy } from "@/lib/taxonomyStore";
import { docHref, docSectionLabel, docTitle } from "@/lib/wikiDocTarget";
import { listRecentChanges } from "@/lib/wikiEditStore";
import { countWantedArticles, getWikiIndexStats, listArticleTitles } from "@/lib/wikiIndexStore";
import { getCategoryView, listUncategorizedArticles, type CategoryView } from "@/lib/wikiStore";

export const metadata: Metadata = {
  title: "위키",
  description: "깨남.COM 위키의 목차. 관문별 문서, 최근 바뀐 문서, 아직 없는 문서를 한자리에서 본다.",
};

/** 첫 화면 오른쪽 열에 싣는 최근 변경 줄 수. 나머지는 `/wiki/recent`가 맡는다. */
const RECENT_ON_INDEX = 8;

/**
 * `위키` 첫 화면 (`docs/WIKI_EXPANSION.md` "첫 화면").
 *
 * 이 화면의 숫자는 전부 실제 값이다. 블루프린트의 `DOCS 128 / 7D 24`는 조판 확인용
 * 예시였고, 여기서는 D1이 실제로 가진 값을 읽는다. 관문별 문서 수는 `wiki_links`로
 * 세고(`getCategoryView`), 미분류 문서는 `listUncategorizedArticles`가 세어 04
 * 구역의 "분류 없음" 통을 채운다.
 */
export default async function WikiIndexPage() {
  const portalKeys = [...coverPortals(), ...shelfPortals()].map((p) => p.key);

  const [stats, changes, taxonomy, articles, wantedArticleCount, categoryViewEntries, uncategorized] =
    await Promise.all([
      getWikiIndexStats(),
      listRecentChanges(RECENT_ON_INDEX),
      getTaxonomy(),
      listArticleTitles(),
      countWantedArticles(),
      Promise.all(portalKeys.map(async (key) => [key, await getCategoryView(key)] as const)),
      listUncategorizedArticles(),
    ]);
  const categoryViews: Record<string, CategoryView> = Object.fromEntries(categoryViewEntries);

  const data = buildWikiIndexData(taxonomy, categoryViews, articles, uncategorized);

  /*
   * 상대 시각은 여기서 짓는다. 클라이언트에서 계산하면 수화가 어긋난다.
   * 한 번 찍은 `now`를 모든 줄에 쓰므로 목록 안에서 시각 기준이 흔들리지 않는다.
   */
  const now = Date.now();
  const recent: RecentRow[] = changes.map((change) => {
    /*
     * 오른쪽 칸에는 그 문서가 어느 갈래에 있는지를 적는다. 매치업 문서는 그 챔피언이
     * 지금 놓인 자리이고, 일반 문서는 아직 갈래가 하나뿐이다 — 분류는 4단계에 붙는다.
     */
    const branch =
      change.target.kind === "matchup"
        ? taxonomy
            .placementsOf(change.target.championSlug)
            .map((p) => p.position.name)
            .join(" · ") || "분류 없음"
        : "일반 문서";

    return {
      id: change.id,
      when: relativeTime(change.createdAt, now),
      at: change.createdAt,
      title: docTitle(change.target),
      section: change.meSlug ? docSectionLabel(change.target, change.meSlug) : null,
      href: docHref(change.target, change.meSlug),
      branch,
    };
  });

  /*
   * "아직 없는 문서" — 분류에 있으나 아무도 쓰지 않은 매치업 + 어딘가에서 링크로
   * 불렸지만 아직 없는 일반 문서(`wiki_links`, 4단계). `/wiki/wanted`와 같은 조건으로
   * 세야 두 화면의 숫자가 어긋나지 않는다.
   */
  const written = new Set(stats.writtenChampionSlugs);
  const wantedChampionCount = classifiedChampionSlugs(taxonomy).filter((slug) => !written.has(slug)).length;
  const wantedCount = wantedChampionCount + wantedArticleCount;

  /*
   * "손이 필요한 곳"에는 미분류 문서를 올리지 않는다. 여기는 "아직 안 쓰인 것"을
   * 세는 자리이고, 미분류는 이미 쓰인 문서가 정리만 안 된 상태라 성격이 다르다.
   * 04 구역 "분류 없음" 통(`data.uncategorized`)이 그 역할을 한다.
   */
  const counters: WorkCounter[] = [
    { key: "wanted", count: wantedCount, label: "아직 없는 문서", href: "/wiki/wanted" },
  ];

  return (
    // useSearchParams를 쓰는 화면이라 Suspense 경계가 필요하다.
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <WikiIndexScreen
        data={data}
        docCount={stats.docCount}
        weekEditCount={stats.weekEditCount}
        recent={recent}
        counters={counters}
      />
    </Suspense>
  );
}
