/**
 * `[[문서명]]` 위키링크 해석.
 *
 * 해석에는 챔피언 카탈로그와 운영 분류가 모두 필요하다. 둘 다 클라이언트로 내려보내기엔
 * 커서, **서버에서 미리 풀어 둔 결과만** 화면으로 보낸다. 실제 문서에 적힌 링크는 보통
 * 몇 개뿐이라 내려가는 양이 작다.
 *
 * 챔피언 데이터를 import하므로 클라이언트 컴포넌트에서 부르지 않는다.
 */

import { allChampions, positions } from "@/data/champions";
import { collectWikiLinkTitles } from "@/lib/wikiMarkup";
import { articleHref, titleKey } from "@/lib/wikiTitle";

/** 문서 이름 -> 주소. 해석되지 않은 이름은 담지 않는다. */
export type WikiLinkMap = Record<string, string>;

/**
 * 지금 있는 일반 문서. `title_key` -> 표시 이름.
 *
 * 이 갈래만 D1을 필요로 하므로 **부르는 쪽이 미리 읽어 넘긴다**. 이 모듈이 저장소를
 * 알게 되면 챔피언 카탈로그를 담은 채로 서버 전용이 되어, 지금 이 함수를 부르고 있는
 * 자리들이 전부 비동기가 된다. 서버 쪽 편의 함수는 `wikiStore.ts`의 `resolveDocLinks`.
 */
export type ArticleIndex = ReadonlyMap<string, string>;

/** 이름·슬러그를 너그럽게 맞춘다. `미드`, `MID`, `mid` 모두 같은 것으로 본다. */
const normalize = titleKey;

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
 * 갈래가 둘이다. 매치업 문서는 챔피언 카탈로그에서 바로 풀리고, 일반 문서는
 * `articles`에 있는 것만 풀린다 — 매치업 문서는 챔피언이 있으면 언제나 열리지만
 * 일반 문서는 누군가 쓰기 전까지 존재하지 않기 때문이다.
 *
 * 매치업을 먼저 본다. `아리 상대법`은 언제나 매치업 문서이고, 같은 이름의 일반 문서는
 * 애초에 만들어지지 않는다 (`checkArticleTitle`).
 *
 * 어느 갈래에도 없으면 빨간 링크가 된다. 위키에서 빨간 링크는 실패가 아니라 **아직
 * 쓰이지 않은 문서를 가리키는 예약**이다.
 */
export function resolveWikiTitle(title: string, articles?: ArticleIndex): string | null {
  const matchup = resolveMatchupTitle(title);
  if (matchup) return matchup;

  const article = articles?.get(normalize(title));
  return article ? articleHref(article) : null;
}

/**
 * 매치업 문서의 정식 이름. 화면과 링크가 같은 말을 쓰게 하는 단일 원본이다.
 *
 * 포지션이 들어가지 않는다. 챔피언 하나당 문서 하나이므로(마이그레이션 0003)
 * `럭스 상대법`이 가리킬 문서는 언제나 하나뿐이고, 포지션은 패치마다 바뀌는 분류라
 * 이름에 박아 두면 이름이 흔들린다.
 */
export function matchupDocTitle(championName: string): string {
  return `${championName} 상대법`;
}

/**
 * 매치업 문서를 가리키는 이름을 주소로 바꾼다.
 *
 * 정식 이름은 `아리 상대법`이고, 그 밖에 사람들이 실제로 적을 만한 꼴을 함께 받는다.
 * 화면이 부르는 이름을 그대로 적었는데 빨간 링크가 되면 이름과 링크가 따로 노는
 * 것이고, 그건 사람이 지킬 규칙이 아니다.
 *
 *   아리 상대법        — 정식 이름
 *   미드 아리 상대법    — 포지션을 앞에 붙인 꼴. 포지션은 이제 장식이라 무시한다
 *   미드/아리          — 통일 이전에 쓰인 링크. 옛 본문에 남아 있으므로 계속 받는다
 *
 * 접미사 `상대법`을 요구하는 것은 `[[아리]]`가 실수로 링크가 되지 않게 하기 위해서다.
 * 챔피언 이름은 본문에 수없이 나오고, 그 전부가 문서 링크인 것은 아니다.
 *
 * 분류 어디에도 없는 챔피언은 null이다. 그 주소는 어차피 404이므로, 링크로 만들어
 * 독자를 막다른 길로 보내는 것보다 빨간 링크로 남기는 편이 낫다 (PRD FR-07).
 */
function resolveMatchupTitle(title: string): string | null {
  const slash = title.indexOf("/");
  if (slash >= 0) {
    /* `미드/아리`와 `미드/아리 상대법`. 앞의 포지션은 확인만 하고 버린다. */
    if (!positionIndex.has(normalize(title.slice(0, slash)))) return null;
    return finish(championIndex.get(normalize(stripSuffix(title.slice(slash + 1)))));
  }

  const bare = stripSuffix(title);
  /* 접미사가 없으면 매치업 문서를 가리키는 이름이 아니다. */
  if (bare === title.trim()) return null;

  const direct = championIndex.get(normalize(bare));
  if (direct) return finish(direct);

  /* `미드 아리 상대법` — 첫 낱말이 포지션이면 떼고 다시 본다. */
  const space = bare.indexOf(" ");
  if (space > 0 && positionIndex.has(normalize(bare.slice(0, space)))) {
    return finish(championIndex.get(normalize(bare.slice(space + 1))));
  }
  return null;
}

/** 이름 끝의 `상대법`을 뗀다. 없으면 그대로 돌려준다. */
function stripSuffix(text: string): string {
  const trimmed = text.trim();
  return trimmed.endsWith("상대법") ? trimmed.slice(0, -3).trim() : trimmed;
}

/**
 * 카탈로그에 있는 챔피언이면 주소를, 아니면 null을 준다.
 *
 * 분류 여부는 보지 않는다. 분류는 운영자가 고치는 값이라(마이그레이션 0004), 그것으로
 * 링크의 생사를 정하면 챔피언을 미드에서 빼는 순간 본문에 걸린 링크가 전부 빨개진다.
 * 문서는 분류와 무관하게 존재한다.
 */
function finish(championSlug: string | undefined): string | null {
  if (!championSlug) return null;
  return `/matchup/${championSlug}`;
}

/** 본문 여러 개에 적힌 위키링크를 한 번에 해석한다. 해석되지 않은 이름은 담지 않는다. */
export function resolveWikiLinks(bodies: string[], articles?: ArticleIndex): WikiLinkMap {
  const map: WikiLinkMap = {};
  for (const body of bodies) {
    for (const title of collectWikiLinkTitles(body)) {
      if (title in map) continue;
      const href = resolveWikiTitle(title, articles);
      if (href) map[title] = href;
    }
  }
  return map;
}

/**
 * 본문에 적힌 이름 가운데 매치업 문서로 풀리지 않는 것.
 *
 * 일반 문서 조회(`resolveDocLinks`)의 후보이자, `wiki_links`에 저장할 이름의
 * 후보이기도 하다(`wikiEditStore.ts`의 `linkStatements`) — **분류(`분류:이름`)를
 * 여기서 빼면 안 된다.** `wiki_links`가 분류 태그를 저장하는 유일한 통로라서,
 * 빼는 순간 분류 기능 자체가 조용히 멈춘다(2026-09-05, 실제로 이 자리에서 한 번
 * 그렇게 만들었다가 고쳤다). 존재하지 않을 분류 이름을 문서 조회에서 거르는 일은
 * `resolveDocLinks` 쪽에서 따로 한다.
 */
export function unresolvedWikiTitles(bodies: string[]): string[] {
  const titles = new Set<string>();
  for (const body of bodies) {
    for (const title of collectWikiLinkTitles(body)) {
      if (!resolveMatchupTitle(title)) titles.add(title);
    }
  }
  return [...titles];
}
