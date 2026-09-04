import type { Metadata } from "next";
import { Suspense } from "react";

import { WikiIndexScreen, type RecentRow, type WorkCounter } from "@/components/wiki/WikiIndexScreen";
import { getChampionBySlug } from "@/data/champions";
import { buildWikiIndexData, classifiedChampionSlugs } from "@/data/wikiIndex";
import { relativeTime } from "@/lib/relativeTime";
import { getTaxonomy } from "@/lib/taxonomyStore";
import { matchupDocTitle } from "@/lib/wikiLink";
import { listRecentChanges } from "@/lib/wikiEditStore";
import { getWikiIndexStats } from "@/lib/wikiIndexStore";

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
 * 예시였고, 여기서는 D1이 실제로 가진 값을 읽는다. 아직 셀 수 없는 것(관문별 문서 수,
 * 미분류 문서)은 **가짜 숫자를 두지 않고 비운다** — 블루프린트 6.5의 규칙이다.
 */
export default async function WikiIndexPage() {
  const [stats, changes, taxonomy] = await Promise.all([
    getWikiIndexStats(),
    listRecentChanges(RECENT_ON_INDEX),
    getTaxonomy(),
  ]);

  const data = buildWikiIndexData(taxonomy);

  /*
   * 상대 시각은 여기서 짓는다. 클라이언트에서 계산하면 수화가 어긋난다.
   * 한 번 찍은 `now`를 모든 줄에 쓰므로 목록 안에서 시각 기준이 흔들리지 않는다.
   */
  const now = Date.now();
  const recent: RecentRow[] = changes.map((change) => {
    const champion = getChampionBySlug(change.championSlug);
    /*
     * 문서 이름은 `matchupDocTitle`이 짓는 하나뿐이다. 챔피언당 문서가 하나이므로
     * 포지션이 이름에 들어가지 않는다 (마이그레이션 0003).
     */
    const title = matchupDocTitle(champion?.name ?? change.championSlug);
    /* 오른쪽 칸에는 그 챔피언이 지금 놓인 자리를 적는다. 이름이 아니라 분류다. */
    const branch =
      taxonomy
        .placementsOf(change.championSlug)
        .map((p) => p.position.name)
        .join(" · ") || "분류 없음";
    const section = change.meSlug
      ? (getChampionBySlug(change.meSlug)?.name ?? change.meSlug)
      : null;

    return {
      id: change.id,
      when: relativeTime(change.createdAt, now),
      at: change.createdAt,
      title,
      section,
      href: `/matchup/${change.championSlug}${change.meSlug ? `?me=${change.meSlug}` : ""}`,
      branch,
    };
  });

  /*
   * "아직 없는 문서" — 분류에 있으나 아무도 쓰지 않은 매치업.
   *
   * 4단계에서 `wiki_links`가 들어오면 여기에 일반 문서의 빨간 링크가 더해진다. 뜻은
   * 지금과 같다: **이미 쓰인 것들이 스스로 "이게 필요하다"고 말해 둔 목록**이다.
   */
  const written = new Set(stats.writtenChampionSlugs);
  const wantedCount = classifiedChampionSlugs(taxonomy).filter((slug) => !written.has(slug)).length;

  /*
   * 미분류 문서는 아직 셀 것이 없다. 일반 문서와 `[[분류:…]]`가 4단계에 들어와야
   * 뜻이 생기는 숫자라, 그때까지 이 자리를 비워 둔다.
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
