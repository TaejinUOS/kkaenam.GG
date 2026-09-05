/**
 * 위키 본문 마크업 처리 — 각주 · 위키링크 · 제목 개요.
 *
 * markdown-to-jsx에는 새 문법을 추가하는 플러그인 API가 없다. 그래서 위키에만 있는
 * 문법(`[* 각주]`, `[[문서명]]` 링크)은 **파싱 전 문자열 변환**으로 처리한다. 변환 결과가
 * 표준 마크다운이므로 렌더러는 `disableParsingRawHTML: true`를 유지할 수 있고, 원시 HTML을
 * 허용하지 않는다는 보안 결정(PRD 10)에 구멍을 내지 않는다.
 *
 * 제목은 반대로 파싱 **전에** 트리로 뽑는다. markdown-to-jsx가 제목을 평평하게 뱉기
 * 때문에 결과물만 보고는 "1.1 아래를 접는다"에 필요한 중첩을 복원할 수 없다.
 *
 * 서버·클라이언트 양쪽에서 쓰므로 이 모듈은 순수 함수만 둔다.
 */

/** 각주 참조가 가리키는 href 접두사. `MarkdownBody`가 이 값으로 각주를 알아본다. */
export const FOOTNOTE_HREF = "#wiki-fn-";

/**
 * 분류 위키링크의 대상 이름 접두사. `[[분류:정글]]`이 이 접두사로 시작한다
 * (`docs/WIKI_EXPANSION.md` "분류").
 */
export const CATEGORY_PREFIX = "분류:";

/** 제목이 분류 링크(`분류:이름`)면 그 이름을, 아니면 null을 준다. */
export function parseCategoryName(title: string): string | null {
  if (!title.startsWith(CATEGORY_PREFIX)) return null;
  const name = title.slice(CATEGORY_PREFIX.length).trim();
  return name || null;
}

/** 가리키는 문서가 없는 위키링크의 href 접두사. 빨간 링크로 그린다. */
export const MISSING_DOC_HREF = "#wiki-missing";

/**
 * 아직 없는 문서의 href. 접두사 뒤에 **이름을 실어 보낸다.**
 *
 * 이름을 함께 보내는 것은 빨간 링크가 이제 막다른 표시가 아니라 **초대**이기
 * 때문이다 — 누르면 그 이름의 빈 문서로 가고, 거기서 바로 쓰기 시작할 수 있다
 * (`docs/WIKI_EXPANSION.md` "진입점"). 마크다운 링크 안에 들어가므로 인코딩한다.
 */
export function missingDocHref(title: string): string {
  return `${MISSING_DOC_HREF}:${encodeURIComponent(title)}`;
}

/** `missingDocHref`가 지은 href에서 문서 이름을 되찾는다. 그 꼴이 아니면 null. */
export function missingDocTitle(href: string): string | null {
  if (!href.startsWith(`${MISSING_DOC_HREF}:`)) return null;
  try {
    return decodeURIComponent(href.slice(MISSING_DOC_HREF.length + 1));
  } catch {
    return null;
  }
}

export type Footnote = {
  /** 1부터. 나온 순서대로 붙는 화면에 보이는 번호다. */
  index: number;
  /** 각주 내용. 마크다운 인라인 문법을 그대로 쓸 수 있다. */
  body: string;
};

export type OutlineNode = {
  /** 앵커 id. 문서 안에서 유일하다. */
  id: string;
  /** `2.1.1` 같은 표시용 번호. */
  number: string;
  /** 제목 원문 (마크다운 인라인 포함). */
  title: string;
  /** 1부터. 목차 들여쓰기와 제목 태그 단계를 정한다. */
  level: number;
  /** 이 제목 직속 본문. 다음 제목 전까지다. */
  lead: string;
  children: OutlineNode[];
};

/* ------------------------------------------------------------------ 코드 회피 */

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/** 인라인 코드 한 덩이. 여러 줄에 걸친 백틱은 드물어 줄 안에서만 찾는다. */
const INLINE_CODE = /(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)/;

/**
 * 코드 바깥의 글자에만 `fn`을 적용한다.
 *
 * 코드 블록에 적힌 `[* 각주]`나 `[[미드/아리]]`는 문법을 설명하는 예제일 때가 많다.
 * 그것까지 링크로 바꿔 버리면 위키에 쓰는 법을 위키에 적을 수 없다.
 */
function mapOutsideCode(source: string, fn: (chunk: string) => string): string {
  let fence: string | null = null;

  return source
    .split("\n")
    .map((line) => {
      const opener = FENCE.exec(line);
      if (fence) {
        // 열려 있는 펜스와 같은 기호가 같은 길이 이상으로 다시 나오면 닫힌다.
        if (opener && opener[1][0] === fence[0] && opener[1].length >= fence.length) fence = null;
        return line;
      }
      if (opener) {
        fence = opener[1];
        return line;
      }

      let out = "";
      let rest = line;
      for (;;) {
        const hit = INLINE_CODE.exec(rest);
        if (!hit) return out + fn(rest);
        out += fn(rest.slice(0, hit.index)) + hit[0];
        rest = rest.slice(hit.index + hit[0].length);
      }
    })
    .join("\n");
}

/* -------------------------------------------------------------------- 각주 */

/**
 * 각주를 뽑아내고 그 자리에 번호 링크를 남긴다.
 *
 * 문법은 `[* 내용]`이다. 내용이 그 자리에 있으므로 글 아래에 정의를 따로 모으지
 * 않아도 되고, 번호는 **나온 순서대로** 1, 2, 3이 붙는다. 정의 순서와 참조 순서가
 * 어긋나 번호가 뒤집히는 일이 구조적으로 생기지 않는다.
 *
 * 내용 안에 `[[문서명]]`처럼 대괄호가 다시 나올 수 있어 정규식으로는 끝을 찾을 수
 * 없다. 대괄호 짝을 세면서 걷고, 인라인 코드 안의 괄호는 세지 않는다.
 *
 * 각주는 한 줄 안에서 닫혀야 한다. 줄을 넘기면 닫는 괄호를 빠뜨린 글이 문서 끝까지
 * 각주로 먹히는데, 짧은 보충 설명이라는 각주의 쓰임을 생각하면 그 위험이 더 크다.
 *
 * 본문을 제목 단위로 쪼개기 **전에** 불러야 번호가 문서 순서대로 매겨진다.
 */
export function extractFootnotes(source: string): { body: string; notes: Footnote[] } {
  const notes: Footnote[] = [];
  let fence: string | null = null;

  const body = source
    .split("\n")
    .map((line) => {
      const opener = FENCE.exec(line);
      if (fence) {
        if (opener && opener[1][0] === fence[0] && opener[1].length >= fence.length) fence = null;
        return line;
      }
      if (opener) {
        fence = opener[1];
        return line;
      }
      return replaceFootnotesInLine(line, notes);
    })
    .join("\n");

  return { body, notes };
}

function replaceFootnotesInLine(line: string, notes: Footnote[]): string {
  let out = "";
  let i = 0;

  while (i < line.length) {
    const code = codeSpanAt(line, i);
    if (code >= 0) {
      // 인라인 코드는 통째로 옮긴다. 그 안의 `[*`는 문법이 아니라 예제다.
      out += line.slice(i, code);
      i = code;
      continue;
    }

    if (line.startsWith("[*", i)) {
      const close = matchingBracket(line, i);
      const content = close > 0 ? line.slice(i + 2, close).trim() : "";
      if (content) {
        const index = notes.length + 1;
        notes.push({ index, body: content });
        out += `[${index}](${FOOTNOTE_HREF}${index})`;
        i = close + 1;
        continue;
      }
    }

    out += line[i];
    i += 1;
  }

  return out;
}

/** `i`에서 인라인 코드가 시작하면 그 span이 끝나는 위치를, 아니면 -1을 준다. */
function codeSpanAt(line: string, i: number): number {
  if (line[i] !== "`") return -1;
  const hit = INLINE_CODE.exec(line.slice(i));
  return hit && hit.index === 0 ? i + hit[0].length : -1;
}

/** `open` 위치의 `[`와 짝이 되는 `]`의 위치. 못 찾으면 -1. */
function matchingBracket(line: string, open: number): number {
  let depth = 0;
  let i = open;

  while (i < line.length) {
    const code = codeSpanAt(line, i);
    if (code >= 0) {
      i = code;
      continue;
    }
    if (line[i] === "[") depth += 1;
    else if (line[i] === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }

  return -1;
}

/* ---------------------------------------------------------------- 위키링크 */

const WIKI_LINK = /\[\[([^[\]|\r\n]+)(?:\|([^[\]\r\n]+))?\]\]/g;

/**
 * 문서 이름 -> 그 문서의 주소. 해석하는 쪽이 무엇을 문서로 볼지 정한다.
 *
 * 매치업만이 아니라 일반 문서까지 받을 수 있게 주소만 돌려준다. 매치업에 매인
 * 모양(`{positionSlug, championSlug}`)이었다면 룬·정글 동선 같은 문서를 붙일 때
 * 이 계층까지 함께 바뀌어야 했다.
 */
export type WikiLinkResolver = (title: string) => string | null;

/**
 * 본문에 적힌 `[[...]]` 문서 이름들을 중복 없이 모은다.
 *
 * 해석은 서버에서 한 번에 해 두고 결과만 화면으로 내려보내기 위한 것이다.
 */
export function collectWikiLinkTitles(body: string): string[] {
  const found = new Set<string>();
  mapOutsideCode(body, (chunk) => {
    for (const hit of chunk.matchAll(WIKI_LINK)) found.add(hit[1].trim());
    return chunk;
  });
  return [...found];
}

/**
 * `[[문서명]]`, `[[문서명 | 출력할 글]]`을 문서 링크로 바꾼다.
 *
 * 편집자는 슬러그가 아니라 아는 이름으로 쓴다. 무엇이 문서인지는 부르는 쪽이 정한다 —
 * 챔피언 카탈로그를 이 모듈로 끌어오면 클라이언트 번들에 170명이 통째로 실리고,
 * 나중에 일반 문서가 생겼을 때 이 계층을 다시 고쳐야 한다.
 *
 * 해석되지 않은 링크는 지우지 않고 `MISSING_DOC_HREF`로 남겨 빨간 링크로 그린다.
 * 위키에서 빨간 링크는 실패가 아니라 **아직 쓰이지 않은 문서를 가리키는 예약**이다.
 * 오타도 같은 방식으로 눈에 띈다.
 *
 * 분류(`[[분류:정글]]`)는 예외다. 본문에 보이는 링크가 아니라 문서에 붙는 태그라서
 * 여기서는 지운다 — 화면(`ArticleScreen` 등)이 본문과 별개로 태그 줄을 그린다. 이름
 * 자체는 `wiki_links`에 그대로 남아 "이 분류의 문서" 조회를 뒷받침한다
 * (`wikiEditStore.ts`의 `linkStatements`, `wikiStore.ts`의 `getCategoryView`).
 */
export function linkifyWikiLinks(body: string, resolve: WikiLinkResolver): string {
  return mapOutsideCode(body, (chunk) =>
    chunk.replace(WIKI_LINK, (_whole, rawTitle: string, rawLabel?: string) => {
      const title = rawTitle.trim();
      if (parseCategoryName(title)) return "";
      const label = (rawLabel ?? title).trim();
      return `[${label}](${resolve(title) ?? missingDocHref(title)})`;
    }),
  );
}

/* ---------------------------------------------------------------- 제목 개요 */

const ATX = /^(#{1,6})[ \t]+(.*?)[ \t]*#*\s*$/;

/** 조각 식별자를 깨뜨리는 글자. 한글은 그대로 둔다. */
const UNSAFE_IN_FRAGMENT = /[#%?/\\&"'<>\s]+/g;

/**
 * 제목에서 앵커를 만든다.
 *
 * markdown-to-jsx의 기본 slugify는 비ASCII를 통째로 버려 한글 제목이 전부 `id=""`가
 * 된다. 목차 링크가 모두 같은 곳을 가리키게 되므로 직접 만든다.
 */
export function headingSlug(title: string): string {
  const plain = stripInlineMarkup(title).replace(UNSAFE_IN_FRAGMENT, "-").replace(/-+/g, "-");
  return plain.replace(/^-|-$/g, "") || "제목";
}

/**
 * 목차와 앵커에 쓸 순수 텍스트. 링크 · 강조 · 코드 표시를 벗긴다.
 *
 * 홑 `~`와 홑 `_`는 남긴다. 이 위키에서 `1~3렙`은 취소선이 아니라 글자 그대로이고,
 * 지우면 `13렙`이 된다. 강조 기호로 확실한 짝(`**`, `__`, `~~`)과 홑 `*`만 벗긴다.
 */
export function stripInlineMarkup(text: string): string {
  return text
    .replace(WIKI_LINK, (_whole, title: string, label?: string) => (label ?? title).trim())
    /*
     * 각주는 제목에서 지운다. 제목은 목차와 앵커로도 쓰여 짧고 안정적이어야 한다.
     * 개요를 만드는 시점에는 이미 번호 링크로 바뀐 뒤라 그 형태를 먼저 지우고,
     * 아직 원문인 경우를 대비해 `[* ...]`도 함께 지운다.
     */
    .replace(new RegExp(`\\[\\d+\\]\\(${FOOTNOTE_HREF}\\d+\\)`, "g"), "")
    .replace(/\[\*[^\]]*\]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|~~/g, "")
    .replace(/[*`]/g, "")
    .trim();
}

/**
 * 본문을 제목 트리로 쪼갠다.
 *
 * 단계를 건너뛰어도(`#` 다음에 바로 `###`) 스택이 받아 준다. 편집자가 단계를 정확히
 * 지키리라 기대할 수 없고, 그 때문에 문서가 깨지면 안 된다.
 *
 * @param idPrefix  앵커 앞에 붙일 섹션 식별자. 섹션이 달라도 제목은 같을 수 있다.
 * @param baseLevel 이 본문의 제목이 문서에서 갖는 첫 단계. 섹션 아래면 2다.
 * @param usedIds   문서 전체에서 이미 쓴 앵커. 같은 제목이 두 번 나오면 번호를 붙인다.
 */
export function buildOutline(
  body: string,
  idPrefix: string,
  baseLevel: number,
  usedIds: Set<string>,
): { lead: string; children: OutlineNode[] } {
  const children: OutlineNode[] = [];
  const stack: { depth: number; node: OutlineNode }[] = [];
  const leadLines: string[] = [];
  let fence: string | null = null;

  const pushLine = (line: string) => {
    const open = stack.length > 0 ? stack[stack.length - 1].node : null;
    if (open) open.lead += (open.lead ? "\n" : "") + line;
    else leadLines.push(line);
  };

  for (const line of body.split("\n")) {
    const opener = FENCE.exec(line);
    if (fence) {
      if (opener && opener[1][0] === fence[0] && opener[1].length >= fence.length) fence = null;
      pushLine(line);
      continue;
    }
    if (opener) {
      fence = opener[1];
      pushLine(line);
      continue;
    }

    const heading = ATX.exec(line);
    if (!heading || !heading[2].trim()) {
      pushLine(line);
      continue;
    }

    const depth = heading[1].length;
    const title = heading[2].trim();

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop();

    const node: OutlineNode = {
      id: uniqueId(`${idPrefix}--${headingSlug(title)}`, usedIds),
      number: "",
      title,
      level: baseLevel + stack.length,
      lead: "",
      children: [],
    };

    if (stack.length > 0) stack[stack.length - 1].node.children.push(node);
    else children.push(node);
    stack.push({ depth, node });
  }

  return { lead: leadLines.join("\n").trim(), children };
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
  used.add(id);
  return id;
}

/** 트리를 훑으며 `1`, `1.1`, `1.1.1` 번호를 매긴다. 본문과 목차가 같은 값을 쓰게 한다. */
export function numberOutline(nodes: OutlineNode[], prefix = ""): void {
  nodes.forEach((node, i) => {
    node.number = prefix ? `${prefix}.${i + 1}` : String(i + 1);
    numberOutline(node.children, node.number);
  });
}
