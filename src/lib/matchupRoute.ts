import { getCategoriesFor, getChampionBySlug, getClassificationFor, positions } from "@/data/champions";
import type { Category, Position } from "@/data/types";

export type MatchupRouteParams = { champion: string };

/** 챔피언이 놓인 자리 하나. 한 챔피언이 여러 포지션에 있을 수 있다 (럭스: 미드·원딜·서폿). */
export type Placement = { position: Position; category: Category };

/**
 * 매치업 라우트 파라미터를 검증해 화면에 필요한 데이터로 바꾼다.
 *
 * **주소에 포지션이 없다.** 문서의 정체성은 챔피언이고 포지션은 분류일 뿐이라,
 * 패치마다 바뀌는 값을 주소에 박아 두면 같은 문서가 여러 주소를 갖거나 분류가 바뀔 때
 * 주소가 죽는다 (마이그레이션 0003).
 *
 * 대신 그 챔피언이 지금 놓인 자리를 전부 돌려준다. 화면은 이것으로 이동 경로를 그린다.
 * 분류 어디에도 없는 챔피언은 문서를 갖지 않는다 — 그 주소는 404다 (PRD FR-07).
 */
export function resolveMatchup({ champion }: MatchupRouteParams) {
  const championData = getChampionBySlug(champion);
  if (!championData) return undefined;

  const placements: Placement[] = [];
  for (const position of positions) {
    const category = getClassificationFor(position.slug, championData.slug);
    if (category) placements.push({ position, category });
  }
  if (placements.length === 0) return undefined;

  return { championData, placements };
}

/** 포지션 하나에 카테고리가 몇 개인지. 이동 경로를 그릴 때 쓴다. */
export function categoryCountFor(positionSlug: string): number {
  return getCategoriesFor(positionSlug).length;
}
