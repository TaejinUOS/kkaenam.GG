/**
 * 위키 관문 — 커버가 붙는 최상위 분류.
 *
 * 설계 근거는 `docs/WIKI_EXPANSION.md`의 "관문은 분류가 아니다"와 "관문은 한 축에서
 * 고른다". 분류는 편집자가 본문에 `[[분류:…]]`를 적으면 생기지만, 커버가 붙는 관문은
 * 운영자만 정한다. 이미지를 붙여야 하는 집합은 열려 있을 수 없기 때문이다.
 *
 * 그래서 이 목록은 코드에 있다 — `taxonomy.ts`가 운영 분류의 단일 원본인 것과 같은
 * 이유다. `wiki_portals` 표와 관리 화면은 4단계에서 붙이고, 그때 이 파일이 시드가 된다.
 *
 * 축은 **시간축**이다. 포지션축은 `상대법` 메뉴가 이미 통째로 갖고 있어 쓸 수 없다.
 */

export type Portal = {
  /**
   * 분류 이름의 title_key. `[[분류:라인전]]`이 이 값에 닿는다.
   * 주소에도 그대로 쓴다: `/wiki?분류=라인전`.
   */
  key: string;
  label: string;
  /**
   * 커버 이미지.
   *
   * 챔피언 포스터와 달리 이 커버는 **그림이 아니라 도해**다 (선·화살표·표·글리프).
   * 지금은 래스터지만 나중에 SVG 컴포넌트로 갈아끼울 수 있고, 그때 바뀌는 것은
   * 이 열의 뜻뿐이다 (`docs/WIKI_EXPANSION.md`).
   */
  coverImage: string;
  coverAlt: string;
  /** 표지에 걸렸을 때 라벨 아래 붙는 한 줄. 무엇이 들어가는 분류인지 말한다. */
  blurb: string;
  /** 낮을수록 앞. 상위 셋만 표지에 걸린다. */
  order: number;
};

/**
 * 표지에 걸리는 관문 수.
 *
 * 관문은 운영하면서 늘어나지만 **표지는 세 장으로 고정**한다 ("회전이 아니라 편성").
 * 캐러셀로 돌리지 않는 이유는 목차의 일이 전부 보여 주는 것이기 때문이고, 표지에서
 * 빠진 관문도 아래 분류 나무에 이름으로 그대로 있다.
 *
 * 이 값이 3인 것은 `POSTER_WEIGHTS[3] = [5, 4, 3]` 조판과 짝을 이룬다.
 */
export const COVER_SLOTS = 3;

export const portals: Portal[] = [
  {
    key: "라인전",
    label: "라인전",
    coverImage: "/images/portal/lane-phase.webp",
    coverAlt: "미니언 웨이브와 교전 거리를 표시한 라인전 도해",
    blurb: "CS · 웨이브 · 견제 · 갱 대비",
    order: 1,
  },
  {
    key: "운영",
    label: "운영",
    coverImage: "/images/portal/macro-play.webp",
    coverAlt: "오브젝트 타이머와 시야·동선을 표시한 운영 도해",
    blurb: "시야 · 오브젝트 · 로밍 · 스플릿",
    order: 2,
  },
  {
    key: "사전",
    label: "사전",
    coverImage: "/images/portal/reference-guide.webp",
    coverAlt: "룬과 아이템 도표를 늘어놓은 사전 도해",
    blurb: "룬 · 아이템 · 용어 · 수치",
    order: 3,
  },
  {
    key: "밴픽",
    label: "밴픽",
    coverImage: "/images/portal/draft-board.webp",
    coverAlt: "조합과 밴 우선순위를 표시한 밴픽 도해",
    blurb: "조합 · 카운터픽 · 밴 우선순위",
    order: 4,
  },
  {
    key: "한타",
    label: "한타",
    coverImage: "/images/portal/teamfight-clash.webp",
    coverAlt: "진입 각도와 포지셔닝을 표시한 한타 도해",
    blurb: "포지셔닝 · 진입 · 궁 순서",
    order: 5,
  },
];

const byOrder = [...portals].sort((a, b) => a.order - b.order);

/** 이번 호 표지에 걸리는 관문. 커버 이미지가 실제로 로드되는 것은 이 셋뿐이다. */
export function coverPortals(): Portal[] {
  return byOrder.slice(0, COVER_SLOTS);
}

/** 표지에서 빠진 나머지. 커버 없이 이름으로 분류 나무에 선다. */
export function shelfPortals(): Portal[] {
  return byOrder.slice(COVER_SLOTS);
}

export function getPortal(key: string): Portal | undefined {
  return portals.find((p) => p.key === key);
}
