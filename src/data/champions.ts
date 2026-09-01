/**
 * Data Dragon 카탈로그와 운영 분류를 합치는 조인 계층.
 *
 * 화면 코드는 이 모듈의 조회 함수만 사용하고 `generated/champions.json`을 직접 읽지 않는다.
 */

import catalog from "./generated/champions.json";
import { categories, classifications, positions } from "./taxonomy";
import type { Category, Champion, ChampionCatalog, Position, RawChampion } from "./types";

const data = catalog as ChampionCatalog;

export const PATCH = data.patch;
export const SYNCED_AT = data.syncedAt;

const CDN = "https://ddragon.leagueoflegends.com/cdn";

export const championIconUrl = (iconFile: string) => `${CDN}/${PATCH}/img/champion/${iconFile}`;
export const skillIconUrl = (iconFile: string) => `${CDN}/${PATCH}/img/spell/${iconFile}`;

/**
 * Aside 핵심 비주얼로 쓰는 정적 2D 일러스트.
 * 세로 구도의 loading 아트가 블루프린트 6.3의 Aside 구성과 종횡비가 맞고,
 * Riot이 배포를 허용한 경로라 사용 권리 확인이 끝난 소스다 (PRD 14 위험 대응).
 */
export const championIllustrationUrl = (championId: string) =>
  `${CDN}/img/champion/loading/${championId}_0.jpg`;

/**
 * 챔피언별 크롭 초점 (PRD 5.3.1 "챔피언별 초점 위치를 지정").
 * loading 아트는 대부분 얼굴이 위쪽 1/3에 놓이므로 기본값을 그 기준으로 둔다.
 */
const FOCUS_DEFAULT = "center 24%";
const FOCUS_OVERRIDES: Record<string, string> = {
  Ahri: "center 20%",
  Aatrox: "center 18%",
  Zed: "center 22%",
  Zoe: "center 26%",
  Yone: "center 20%",
  Teemo: "center 34%",
  Lulu: "center 30%",
  Blitzcrank: "center 18%",
  Caitlyn: "center 20%",
  Lillia: "center 26%",
  LeeSin: "center 20%",
  DrMundo: "center 20%",
  Brand: "center 22%",
};

function decorate(raw: RawChampion): Champion {
  return {
    ...raw,
    iconUrl: championIconUrl(raw.iconFile),
    illustrationUrl: championIllustrationUrl(raw.id),
    focus: FOCUS_OVERRIDES[raw.id] ?? FOCUS_DEFAULT,
    active: true,
  };
}

const byName = new Map<string, Champion>();
const bySlug = new Map<string, Champion>();

for (const raw of data.champions) {
  const champion = decorate(raw);
  byName.set(champion.name, champion);
  bySlug.set(champion.slug, champion);
}

export const allChampions: Champion[] = [...bySlug.values()].sort((a, b) =>
  a.name.localeCompare(b.name, "ko"),
);

/**
 * 운영 분류에 적힌 이름이 카탈로그에 모두 존재하는지 확인한다.
 * 이름 오타는 조용히 빈 목록으로 이어지므로 모듈 로드 시점에 바로 드러내는 편이 낫다.
 */
const unresolved = [
  ...new Set(classifications.filter((c) => !byName.has(c.championName)).map((c) => c.championName)),
];
if (unresolved.length > 0) {
  throw new Error(
    `taxonomy.ts의 챔피언 이름이 Data Dragon(${PATCH}, ko_KR) 카탈로그와 일치하지 않습니다: ${unresolved.join(", ")}`,
  );
}

export function getPosition(slug: string): Position | undefined {
  return positions.find((p) => p.slug === slug && p.active);
}

export function getCategoriesFor(positionSlug: string): Category[] {
  return categories
    .filter((c) => c.positionSlug === positionSlug && c.active)
    .sort((a, b) => a.order - b.order);
}

export function getCategory(positionSlug: string, categorySlug: string): Category | undefined {
  return getCategoriesFor(positionSlug).find((c) => c.slug === categorySlug);
}

export function getChampionBySlug(slug: string): Champion | undefined {
  return bySlug.get(slug);
}

/** 선택한 포지션·카테고리에 속하고 노출 상태인 챔피언만 정렬해 돌려준다. */
export function getChampionsIn(positionSlug: string, categorySlug: string): Champion[] {
  return classifications
    .filter(
      (c) => c.positionSlug === positionSlug && c.categorySlug === categorySlug && c.visible,
    )
    .sort((a, b) => a.order - b.order)
    .map((c) => byName.get(c.championName))
    .filter((c): c is Champion => Boolean(c) && c!.active);
}

/** 한 포지션 전체의 챔피언. Me 콤보박스의 기본 검색 대상이다 (PRD 5.3.3). */
export function getChampionsInPosition(positionSlug: string): Champion[] {
  const seen = new Set<string>();
  const result: Champion[] = [];
  for (const category of getCategoriesFor(positionSlug)) {
    for (const champion of getChampionsIn(positionSlug, category.slug)) {
      if (seen.has(champion.slug)) continue;
      seen.add(champion.slug);
      result.push(champion);
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

/** 챔피언이 어느 포지션·카테고리에 속하는지. 상대법 페이지의 breadcrumb에 사용한다. */
export function getClassificationFor(positionSlug: string, championSlug: string) {
  const champion = bySlug.get(championSlug);
  if (!champion) return undefined;
  const match = classifications.find(
    (c) => c.positionSlug === positionSlug && c.championName === champion.name && c.visible,
  );
  if (!match) return undefined;
  return getCategory(positionSlug, match.categorySlug);
}

export { categories, positions };
