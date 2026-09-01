/** PRD 8 "콘텐츠 및 데이터 요구사항"의 도메인 타입. */

export type SkillSlot = "Q" | "W" | "E" | "R";

/** Data Dragon에서 동기화한 원본 스킬 레코드. */
export type Skill = {
  slot: SkillSlot;
  id: string;
  name: string;
  description: string;
  /** "9/8/7/6/5"처럼 레벨별 수치를 유지한다. 값이 없으면 null. */
  cooldown: string | null;
  cost: string | null;
  costType: string;
  range: string | null;
  iconFile: string;
};

/** Data Dragon에서 동기화한 원본 챔피언 레코드. */
export type RawChampion = {
  id: string;
  slug: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  iconFile: string;
  spells: Skill[];
};

export type ChampionCatalog = {
  patch: string;
  locale: string;
  syncedAt: string;
  champions: RawChampion[];
};

/** 화면에서 사용하는 챔피언. 원본에 이미지 URL과 운영 상태를 덧붙인다. */
export type Champion = RawChampion & {
  /** 1:1 아이콘. 챔피언 Contact Sheet와 Me 콤보박스에서 사용한다. */
  iconUrl: string;
  /** Aside 핵심 비주얼로 사용하는 정적 2D 일러스트. */
  illustrationUrl: string;
  /** 일러스트 크롭 시 유지할 초점 위치 (PRD 5.3.1). */
  focus: string;
  /** PRD 8 "챔피언 운영 상태". */
  active: boolean;
};

export type Position = {
  id: string;
  /** URL 슬러그. top / jungle / mid / adc / support */
  slug: string;
  name: string;
  /** 메타데이터 줄과 모노 레이블에 쓰는 짧은 영문 코드. */
  code: string;
  order: number;
  active: boolean;
};

export type Category = {
  id: string;
  slug: string;
  positionSlug: string;
  name: string;
  /** PRD 5.1이 지정한 대표 이미지 경로. */
  coverImage: string;
  coverAlt: string;
  /** 포스터에 함께 노출하는 한 줄 역할 설명. */
  role: string;
  order: number;
  active: boolean;
};

/** PRD 8 "포지션별 챔피언 분류". 같은 포지션 안에서는 하나의 카테고리에만 속한다. */
export type Classification = {
  positionSlug: string;
  categorySlug: string;
  /** Data Dragon 기준 한글 챔피언명. */
  championName: string;
  visible: boolean;
  order: number;
};

/** PRD 8 "Me 전용 Tip 블록". */
export type MeBlock = {
  id: string;
  /** 내 챔피언 슬러그. */
  championSlug: string;
  body: string;
  order: number;
};

/** PRD 8 "Tip". */
export type Tip = {
  id: string;
  positionSlug: string;
  /** 상대 챔피언 슬러그. */
  championSlug: string;
  authorId: string;
  authorName: string;
  title: string;
  /** 내 챔피언과 무관하게 항상 표시되는 본문. */
  general: string;
  meBlocks: MeBlock[];
  patch: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  updatedAt: string;
};
