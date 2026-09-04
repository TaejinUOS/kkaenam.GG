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
 * 지금 존재하는 문서는 매치업뿐이다. 룬·정글 동선 같은 **일반 문서는 아직 없으므로
 * 전부 null**이 되어 빨간 링크로 그려진다. 위키에서 빨간 링크는 실패가 아니라 아직
 * 쓰이지 않은 문서를 가리키는 예약이고, 일반 문서 저장소가 생기면 이 함수에 갈래를
 * 하나 더 두는 것으로 살아난다.
 */
export function resolveWikiTitle(title: string): string | null {
  return resolveMatchupTitle(title);
}

/** 매치업 문서의 정식 이름. 화면과 링크가 같은 말을 쓰게 하는 단일 원본이다. */
export function matchupDocTitle(positionName: string, championName: string): string {
  return `${positionName} ${championName} 상대법`;
}

/** 챔피언 슬러그 → 그 챔피언이 속한 포지션 슬러그들. 포지션을 생략한 이름을 풀 때 쓴다. */
const championPositions = new Map<string, string[]>();
for (const position of positions) {
  for (const champion of allChampions) {
    if (!getClassificationFor(position.slug, champion.slug)) continue;
    championPositions.set(champion.slug, [
      ...(championPositions.get(champion.slug) ?? []),
      position.slug,
    ]);
  }
}

/**
 * 매치업 문서를 가리키는 이름을 주소로 바꾼다.
 *
 * 세 가지 꼴을 모두 받는다. 화면이 `미드 아리 상대법`이라고 부르는 문서를 편집자가
 * 그대로 `[[미드 아리 상대법]]`이라고 적었을 때 빨간 링크가 되면, 이름과 링크가 따로
 * 노는 것이고 그건 사람이 지킬 규칙이 아니다 (`docs/WIKI_EXPANSION.md` "이름이 곧 주소다").
 *
 *   미드/아리          — 주소를 그대로 옮긴 짧은 꼴
 *   미드 아리 상대법    — 정식 이름. 화면이 쓰는 것과 같다
 *   아리 상대법        — 포지션 생략. 그 챔피언이 한 포지션에만 있을 때만 풀린다
 *
 * 마지막 꼴은 **모호하면 일부러 풀지 않는다.** `럭스 상대법`은 미드·원딜·서폿 세
 * 문서를 가리킬 수 있어, 아무 데나 걸면 독자를 엉뚱한 문서로 보낸다. 빨간 링크로
 * 남겨 편집자가 포지션을 적게 하는 편이 낫다.
 *
 * 분류에 없는 조합(`미드/가렌`)도 null이다. 그 주소는 어차피 404이므로, 링크로 만들어
 * 독자를 막다른 길로 보내는 것보다 빨간 링크로 남기는 편이 낫다 (PRD FR-07).
 */
function resolveMatchupTitle(title: string): string | null {
  const slash = title.indexOf("/");
  if (slash >= 0) {
    /* `미드/아리` 그리고 `미드/아리 상대법`. 뒤에 붙은 `상대법`은 떼고 본다. */
    return finish(
      positionIndex.get(normalize(title.slice(0, slash))),
      championIndex.get(normalize(stripSuffix(title.slice(slash + 1)))),
    );
  }

  const bare = stripSuffix(title);
  /* 접미사 `상대법`이 없으면 매치업 문서를 가리키는 이름이 아니다. */
  if (bare === title.trim()) return null;

  /* `미드 아리 상대법` — 첫 낱말이 포지션이면 나머지가 챔피언이다. */
  const space = bare.indexOf(" ");
  if (space > 0) {
    const positionSlug = positionIndex.get(normalize(bare.slice(0, space)));
    if (positionSlug) {
      return finish(positionSlug, championIndex.get(normalize(bare.slice(space + 1))));
    }
  }

  /* `아리 상대법` — 포지션이 생략됐다. 한 곳에만 있는 챔피언일 때만 풀린다. */
  const championSlug = championIndex.get(normalize(bare));
  if (!championSlug) return null;
  const owners = championPositions.get(championSlug);
  if (owners?.length !== 1) return null;
  return finish(owners[0], championSlug);
}

/** 이름 끝의 `상대법`을 뗀다. 없으면 그대로 돌려준다. */
function stripSuffix(text: string): string {
  const trimmed = text.trim();
  return trimmed.endsWith("상대법") ? trimmed.slice(0, -3).trim() : trimmed;
}

function finish(positionSlug: string | undefined, championSlug: string | undefined): string | null {
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
