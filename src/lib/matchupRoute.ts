import { getChampionBySlug } from "@/data/champions";
import type { Placement, TaxonomySnapshot } from "@/lib/taxonomyStore";

export type MatchupRouteParams = { champion: string };

export type { Placement };

/**
 * 매치업 라우트 파라미터를 검증해 화면에 필요한 데이터로 바꾼다.
 *
 * **주소에 포지션이 없다.** 문서의 정체성은 챔피언이고 포지션은 분류일 뿐이라,
 * 패치마다 바뀌는 값을 주소에 박아 두면 같은 문서가 여러 주소를 갖거나 분류가 바뀔 때
 * 주소가 죽는다 (마이그레이션 0003).
 *
 * **분류에 없어도 문서는 열린다.** 예전에는 분류에 없는 조합을 404로 막았지만
 * (PRD FR-07), 그 규칙은 포지션이 주소에 있던 시절의 것이다. 지금은 운영자가 분류를
 * 고칠 수 있으므로(마이그레이션 0004), 챔피언을 어느 포지션에서 빼는 순간 그 문서가
 * 404가 되어 버린다. **이미 쓰인 글이 분류 변경만으로 사라지는 일은 없어야 한다.**
 * 카탈로그에 있는 챔피언이면 주소가 살아 있고, 분류는 "어디서 찾을 수 있는가"만 정한다.
 */
export function resolveMatchup({ champion }: MatchupRouteParams, taxonomy: TaxonomySnapshot) {
  const championData = getChampionBySlug(champion);
  if (!championData) return undefined;

  return { championData, placements: taxonomy.placementsOf(championData.slug) };
}
