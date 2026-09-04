/**
 * `위키` 첫 화면이 사용하는 직렬화 가능한 데이터 뷰.
 *
 * 설계는 `docs/WIKI_EXPANSION.md`의 "첫 화면". 검색과 분류 펼치기가 서버를 다시
 * 왕복하지 않아야 하므로, `selection.ts`와 같은 방식으로 첫 응답에 실어 보낸다.
 *
 * 여기 담기는 것은 **분류에서 나오는 것**뿐이다. 문서 수·최근 변경처럼 D1에서
 * 읽어야 하는 값은 서버 페이지가 따로 읽어 화면에 넘긴다.
 */

import { getCategoriesFor, getChampionsInPosition, positions } from "./champions";
import { coverPortals, shelfPortals, type Portal } from "./portals";

export type PortalView = Portal & {
  /**
   * 이 관문에 달린 일반 문서 수.
   *
   * `[[분류:…]]`와 `wiki_links`가 4단계에 들어오기 전까지는 셀 것이 없어 0이다.
   * 0인 관문은 숫자 대신 "첫 문서를 기다립니다"로 그린다 — `문서 0`을 큰 커버 아래
   * 붙이면 죽은 사이트로 보이고, 그건 사실도 아니다.
   */
  docCount: number;
};

/** 분류 나무의 한 갈래. 블루프린트 04 구역이 이 목록을 세로줄로 그린다. */
export type TreeBranch = {
  label: string;
  href?: string;
  items: TreeItem[];
  /** 항목이 하나도 없을 때 대신 보여 줄 문구. */
  emptyNote?: string;
};

export type TreeItem = {
  label: string;
  href?: string;
  /** 아직 문서가 없는 항목. 빨간 링크와 같은 뜻으로 흐리게 그린다. */
  pending?: boolean;
};

/** 이름 검색 대상. 지금은 매치업 문서와 관문뿐이고, 일반 문서는 5단계에 더해진다. */
export type SearchEntry = {
  title: string;
  href: string;
  kind: "matchup" | "portal";
  /** 어느 갈래의 문서인지. 결과 줄 오른쪽에 흐리게 붙는다. */
  branch: string;
};

export type WikiIndexData = {
  cover: PortalView[];
  shelf: PortalView[];
  tree: TreeBranch[];
  search: SearchEntry[];
};

/**
 * 분류에 있는 모든 매치업 문서의 키. `${포지션}/${챔피언}` 꼴이다.
 *
 * "아직 없는 문서"를 세는 근거다. 분류에 있으나 아직 아무도 쓰지 않은 매치업이
 * 곧 빨간 링크와 같은 뜻이고, 빈 위키에서 값이 가장 큰 목록이다
 * (`docs/WIKI_EXPANSION.md` "아직 없는 문서 목록").
 */
export function allMatchupKeys(): string[] {
  const keys: string[] = [];
  for (const position of positions) {
    for (const champion of getChampionsInPosition(position.slug)) {
      keys.push(`${position.slug}/${champion.slug}`);
    }
  }
  return keys;
}

export function buildWikiIndexData(
  /** 관문별 일반 문서 수. 4단계에서 `wiki_links`가 채운다. */
  articleCounts: Record<string, number> = {},
): WikiIndexData {
  const withCount = (portal: Portal): PortalView => ({
    ...portal,
    docCount: articleCounts[portal.key] ?? 0,
  });

  const search: SearchEntry[] = [];
  for (const position of positions) {
    for (const champion of getChampionsInPosition(position.slug)) {
      search.push({
        title: `${position.name}/${champion.name}`,
        href: `/matchup/${position.slug}/${champion.slug}`,
        kind: "matchup",
        branch: "상대법",
      });
    }
  }
  for (const portal of [...coverPortals(), ...shelfPortals()]) {
    search.push({
      title: portal.label,
      href: `/wiki?${new URLSearchParams({ 분류: portal.key })}`,
      kind: "portal",
      branch: "분류",
    });
  }

  /*
   * 나무는 두 갈래를 함께 보여 준다 (`docs/WIKI_EXPANSION.md` "나무").
   * 상대법 갈래는 `taxonomy.ts`에서 자동으로 나오고, 일반 문서 갈래는 관문에서 나온다.
   * 관문 아래의 하위 분류는 편집자가 `[[분류:…]]`로 만드는 것이라 4단계에 채워진다.
   */
  const tree: TreeBranch[] = [
    {
      label: "상대법",
      href: "/",
      items: positions.map((position) => ({
        label: position.name,
        href: `/?position=${position.slug}`,
      })),
    },
    {
      label: "일반 문서",
      items: [...coverPortals(), ...shelfPortals()].map((portal) => ({
        label: portal.label,
        href: `/wiki?${new URLSearchParams({ 분류: portal.key })}`,
        pending: (articleCounts[portal.key] ?? 0) === 0,
      })),
    },
    {
      label: "기타",
      items: [{ label: "분류 없음", pending: true }],
      emptyNote: "분류를 안 적은 문서가 모이는 곳",
    },
  ];

  return {
    cover: coverPortals().map(withCount),
    shelf: shelfPortals().map(withCount),
    tree,
    search,
  };
}

/** 포지션별 카테고리 이름. 나무의 상대법 갈래에 부제로 붙인다. */
export function categoryNamesFor(positionSlug: string): string[] {
  return getCategoriesFor(positionSlug).map((c) => c.name);
}
