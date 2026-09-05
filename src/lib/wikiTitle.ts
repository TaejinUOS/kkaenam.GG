/**
 * 일반 문서의 이름 규칙 — 이름이 곧 주소다.
 *
 * `[[정글 동선]]`이라고 쓰면 그 이름으로 문서를 찾는다. 이름과 주소가 따로 놀면
 * 편집자가 둘을 함께 관리해야 하는데, 그건 사람이 지킬 규칙이 아니다
 * (`docs/WIKI_EXPANSION.md` "이름이 곧 주소다").
 *
 * 이 모듈은 챔피언 카탈로그도 D1도 부르지 않는다. 클라이언트(제목 칸)와 서버(저장
 * 시점 판정)가 **같은 규칙**을 써야 하는데, 그 둘 사이에 무거운 것을 끼워 넣을 수 없다.
 */

/** 문서 이름 최대 길이. 목록·검색의 한 줄에 들어가야 하는 값이다. */
export const MAX_TITLE_LENGTH = 60;

/**
 * `/wiki` 아래 화면들이 이미 쓰고 있는 이름. 문서가 이 이름을 가지면 주소가 가려진다
 * (Next.js는 정적 구간을 동적 구간보다 먼저 맞춘다).
 */
const RESERVED_KEYS = new Set(["recent", "wanted", "new"]);

/** 주소·링크·제목을 깨뜨리는 글자. `/`는 주소 구간을, 나머지는 위키 문법을 깬다. */
const FORBIDDEN = /[[\]|#/\\?<>]/;

/**
 * 이름을 유일성과 주소의 근거가 되는 키로 바꾼다.
 *
 * `wikiLink.ts`의 링크 해석과 같은 규칙(소문자·공백 제거)이다. 그래야
 * `[[정글 동선]]`과 `[[정글동선]]`이 같은 문서에 닿는다.
 */
export function titleKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, "");
}

/** 일반 문서의 주소. 한글을 그대로 쓰고 인코딩만 한다. */
export function articleHref(title: string): string {
  return `/wiki/${encodeURIComponent(title.trim())}`;
}

export type TitleProblem = "empty" | "too_long" | "forbidden_char" | "reserved" | "matchup_suffix";

/** 사람에게 보여 줄 문구. 화면과 서버 액션이 같은 말을 쓴다. */
export const TITLE_PROBLEM_MESSAGE: Record<TitleProblem, string> = {
  empty: "문서 이름을 적어 주세요.",
  too_long: `문서 이름은 ${MAX_TITLE_LENGTH}자를 넘을 수 없습니다.`,
  forbidden_char: "문서 이름에 대괄호·세로줄·우물정·빗금·물음표·부등호는 쓸 수 없습니다.",
  reserved: "그 이름은 위키 화면이 이미 쓰고 있습니다.",
  matchup_suffix: "「…상대법」은 매치업 문서의 이름입니다. 다른 이름을 지어 주세요.",
};

/**
 * 이름이 규칙에 맞는지 본다. 맞으면 null.
 *
 * `…상대법`을 막는 것은 그 접미사가 **매치업 문서의 이름 공간**이기 때문이다
 * (`resolveWikiTitle`). 일반 문서가 그 꼴의 이름을 가지면 링크는 늘 매치업 쪽으로
 * 먼저 가고, 그 문서는 자기 이름으로 영영 닿을 수 없게 된다.
 */
export function checkArticleTitle(title: string): TitleProblem | null {
  const trimmed = title.trim();
  if (!trimmed) return "empty";
  if (trimmed.length > MAX_TITLE_LENGTH) return "too_long";
  if (FORBIDDEN.test(trimmed)) return "forbidden_char";
  if (RESERVED_KEYS.has(titleKey(trimmed))) return "reserved";
  if (trimmed.endsWith("상대법")) return "matchup_suffix";
  return null;
}
