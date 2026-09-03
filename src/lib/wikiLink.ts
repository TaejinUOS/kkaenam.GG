/**
 * `[[문서명]]` 위키링크 해석.
 *
 * 해석에는 챔피언 카탈로그와 운영 분류가 모두 필요하다. 둘 다 클라이언트로 내려보내기엔
 * 커서, **서버에서 미리 풀어 둔 결과만** 화면으로 보낸다. 실제 문서에 적힌 링크는 보통
 * 몇 개뿐이라 내려가는 양이 작다.
 *
 * 챔피언 데이터를 import하므로 클라이언트 컴포넌트에서 부르지 않는다.
 */

import { allChampions, getClassificationFor, positions } from "@/data/champions";
import { collectWikiLinkTitles } from "@/lib/wikiMarkup";

/** 문서 이름 -> 주소. 해석되지 않은 이름은 담지 않는다. */
export type WikiLinkMap = Record<string, string>;

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
 * 문서 이름 하나를 주소로 바꾼다. 그런 문서가 없으면 null.
 *
 * 지금 존재하는 문서는 매치업뿐이고, 그 이름은 `포지션/챔피언`이다 (`미드/아리`).
 * 룬·정글 동선 같은 **일반 문서는 아직 없으므로 전부 null**이 되어 빨간 링크로 그려진다.
 * 위키에서 빨간 링크는 실패가 아니라 아직 쓰이지 않은 문서를 가리키는 예약이고,
 * 일반 문서 저장소가 생기면 이 함수에 갈래를 하나 더 두는 것으로 살아난다.
 */
export function resolveWikiTitle(title: string): string | null {
  return resolveMatchupTitle(title);
}

/**
 * `포지션/챔피언` 꼴을 매치업 문서 주소로 바꾼다.
 *
 * 분류에 없는 조합(`미드/가렌`)도 null이다. 그 주소는 어차피 404이므로, 링크로 만들어
 * 독자를 막다른 길로 보내는 것보다 빨간 링크로 남기는 편이 낫다 (PRD FR-07).
 */
function resolveMatchupTitle(title: string): string | null {
  const slash = title.indexOf("/");
  if (slash < 0) return null;

  const positionSlug = positionIndex.get(normalize(title.slice(0, slash)));
  const championSlug = championIndex.get(normalize(title.slice(slash + 1)));
  if (!positionSlug || !championSlug) return null;

  if (!getClassificationFor(positionSlug, championSlug)) return null;
  return `/matchup/${positionSlug}/${championSlug}`;
}

/** 본문 여러 개에 적힌 위키링크를 한 번에 해석한다. 해석되지 않은 이름은 담지 않는다. */
export function resolveWikiLinks(bodies: string[]): WikiLinkMap {
  const map: WikiLinkMap = {};
  for (const body of bodies) {
    for (const title of collectWikiLinkTitles(body)) {
      if (title in map) continue;
      const href = resolveWikiTitle(title);
      if (href) map[title] = href;
    }
  }
  return map;
}
