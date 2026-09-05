/**
 * Data Dragon 카탈로그와 운영 분류를 합치는 조인 계층.
 *
 * 화면 코드는 이 모듈의 조회 함수만 사용하고 `generated/champions.json`을 직접 읽지 않는다.
 */

import catalog from "./generated/champions.json";
import {
  categories,
  classifications,
  getCategoriesFor,
  getCategory,
  getPosition,
  positions,
} from "./taxonomy";
import type { Champion, ChampionCatalog, RawChampion } from "./types";

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

export function getChampionBySlug(slug: string): Champion | undefined {
  return bySlug.get(slug);
}

/*
 * 챔피언이 어느 포지션·카테고리에 속하는지는 **여기서 답하지 않는다.**
 * 그 값은 패치마다 바뀌므로 D1의 `champion_placements`로 옮겼다 (마이그레이션 0004).
 * `getTaxonomy()`가 주는 스냅숏에 물어본다 (`src/lib/taxonomyStore.ts`).
 *
 * 이 모듈에 남은 것은 Data Dragon 카탈로그, 즉 **바뀌지 않는 사실**뿐이다.
 */

export { categories, getCategoriesFor, getCategory, getPosition, positions };
