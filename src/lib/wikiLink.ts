/**
 * `[[미드/아리]]` 위키링크 해석.
 *
 * 해석에는 챔피언 카탈로그와 운영 분류가 모두 필요하다. 둘 다 클라이언트로 내려보내기엔
 * 커서, **서버에서 미리 풀어 둔 결과만** 화면으로 보낸다. 실제 문서에 적힌 링크는 보통
 * 몇 개뿐이라 내려가는 양이 작다.
 *
 * 챔피언 데이터를 import하므로 클라이언트 컴포넌트에서 부르지 않는다.
 */

import { allChampions, getClassificationFor, positions } from "@/data/champions";
import { type WikiLinkTarget, collectWikiLinkTargets } from "@/lib/wikiMarkup";

/** 해석된 링크. 원문에 적힌 대상 문자열을 그대로 열쇠로 쓴다. */
export type WikiLinkMap = Record<string, WikiLinkTarget>;

/** 이름·슬러그를 너그럽게 맞춘다. `미드`, `MID`, `mid` 모두 같은 것으로 본다. */
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

const positionIndex = new Map<string, string>();
for (const position of positions) {
  positionIndex.set(normalize(position.name), position.slug);
  positionIndex.set(normalize(position.slug), position.slug);
  positionIndex.set(normalize(position.code), position.slug);
}

const championIndex = new Map<string, string>();
for (const champion of allChampions) {
  championIndex.set(normalize(champion.name), champion.slug);
  championIndex.set(normalize(champion.slug), champion.slug);
}

/**
 * `포지션/챔피언` 한 건을 해석한다. 없는 조합이면 null.
 *
 * 분류에 없는 조합(`미드/가렌`)도 null이다. 그 주소는 어차피 404이므로, 링크로 만들어
 * 보내는 것보다 빨간 링크로 남겨 편집자가 알아채게 하는 편이 낫다 (PRD FR-07).
 */
export function resolveWikiTarget(target: string): WikiLinkTarget | null {
  const slash = target.indexOf("/");
  if (slash < 0) return null;

  const positionSlug = positionIndex.get(normalize(target.slice(0, slash)));
  const championSlug = championIndex.get(normalize(target.slice(slash + 1)));
  if (!positionSlug || !championSlug) return null;

  if (!getClassificationFor(positionSlug, championSlug)) return null;
  return { positionSlug, championSlug };
}

/** 본문 여러 개에 적힌 위키링크를 한 번에 해석한다. 해석되지 않은 대상은 담지 않는다. */
export function resolveWikiLinks(bodies: string[]): WikiLinkMap {
  const map: WikiLinkMap = {};
  for (const body of bodies) {
    for (const target of collectWikiLinkTargets(body)) {
      if (target in map) continue;
      const hit = resolveWikiTarget(target);
      if (hit) map[target] = hit;
    }
  }
  return map;
}
