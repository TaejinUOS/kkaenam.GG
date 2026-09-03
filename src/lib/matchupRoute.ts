import {
  getChampionBySlug,
  getClassificationFor,
  getPosition,
} from "@/data/champions";

export type MatchupRouteParams = { position: string; champion: string };

/**
 * 매치업 라우트 파라미터를 검증해 화면에 필요한 데이터로 바꾼다. 조합이 틀리면 undefined.
 * `/matchup/[position]/[champion]`과 그 하위 라우트(`history` 등)가 함께 쓴다.
 */
export function resolveMatchup({ position, champion }: MatchupRouteParams) {
  const positionData = getPosition(position);
  const championData = getChampionBySlug(champion);
  if (!positionData || !championData) return undefined;

  // PRD FR-07: 다른 포지션의 콘텐츠가 섞이지 않도록 분류에 없는 조합은 허용하지 않는다.
  const category = getClassificationFor(position, champion);
  if (!category) return undefined;

  return { positionData, championData, category };
}
