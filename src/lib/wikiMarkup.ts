/**
 * 위키 본문 마크업 처리 — 각주 · 위키링크 · 제목 개요.
 *
 * markdown-to-jsx에는 새 문법을 추가하는 플러그인 API가 없다. 그래서 위키에만 있는
 * 문법(각주 호버, `[[문서]]` 링크)은 **파싱 전 문자열 변환**으로 처리한다. 변환 결과가
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

/** 가리키는 문서가 없는 위키링크의 href. 빨간 링크로 그린다. */
export const MISSING_DOC_HREF = "#wiki-missing";

export type Footnote = {
  /** 원문에 적힌 별칭. `[^가]`의 `가`. */
  key: string;
  /** 1부터. 화면에 보이는 번호다. */
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
 * 코드 블록에 적힌 `[^1]`이나 `[[미드/아리]]`는 문법을 설명하는 예제일 때가 많다.
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

/** 코드 블록 바깥의 줄만 `visit`에 넘긴다. `visit`이 false를 돌려주면 그 줄을 버린다. */
function filterOutsideCode(source: string, visit: (line: string) => boolean): string {
  let fence: string | null = null;

  return source
    .split("\n")
    .filter((line) => {
      const opener = FENCE.exec(line);
      if (fence) {
        if (opener && opener[1][0] === fence[0] && opener[1].length >= fence.length) fence = null;
        return true;
      }
      if (opener) {
        fence = opener[1];
        return true;
      }
      return visit(line);
    })
    .join("\n");
}

/* -------------------------------------------------------------------- 각주 */

const FOOTNOTE_DEF = /^\[\^([^\]\r\n]+)\]:[ \t]*(.*)$/;
const FOOTNOTE_REF = /\[\^([^\]\r\n]+)\]/g;

/**
 * 각주 정의(`[^가]: 내용`) 줄을 본문에서 걷어내고 목록으로 돌려준다.
 *
 * 정의는 한 줄이다. 여러 줄에 걸친 각주는 받지 않는다 — 편집자가 외울 규칙이 적은
 * 쪽이 낫고, 짧은 보충 설명이라는 각주의 쓰임에도 맞는다.
 *
 * 본문을 제목 단위로 쪼개기 **전에** 불러야 한다. 그러지 않으면 글 끝에 모아 둔
 * 정의가 앞쪽 소제목의 참조에서 보이지 않는다.
 */
export function extractFootnotes(source: string): { body: string; notes: Footnote[] } {
  const notes: Footnote[] = [];
  const seen = new Set<string>();

  const body = filterOutsideCode(source, (line) => {
    const def = FOOTNOTE_DEF.exec(line);
    if (!def) return true;

    const key = def[1].trim();
    // 같은 별칭을 두 번 정의하면 먼저 쓴 것을 남긴다. 둘 다 지우면 참조가 미아가 된다.
    if (key && !seen.has(key)) {
      seen.add(key);
      notes.push({ key, index: notes.length + 1, body: def[2].trim() });
    }
    return false;
  });

  return { body, notes };
}

/**
 * 각주 참조 `[^가]`를 표준 마크다운 링크로 바꾼다.
 *
 * 정의가 없는 참조는 손대지 않고 그대로 둔다. 조용히 사라지면 편집자가 오타를
 * 알아채지 못한다.
 */
export function linkifyFootnotes(body: string, notes: Footnote[]): string {
  if (notes.length === 0) return body;
  const byKey = new Map(notes.map((note) => [note.key, note]));

  return mapOutsideCode(body, (chunk) =>
    chunk.replace(FOOTNOTE_REF, (whole, rawKey: string) => {
      const note = byKey.get(rawKey.trim());
      return note ? `[${note.index}](${FOOTNOTE_HREF}${note.index})` : whole;
    }),
  );
}

/* ---------------------------------------------------------------- 위키링크 */

const WIKI_LINK = /\[\[([^[\]|\r\n]+)(?:\|([^[\]\r\n]+))?\]\]/g;

export type WikiLinkTarget = { positionSlug: string; championSlug: string };

/**
 * 본문에 적힌 `[[...]]` 대상들을 중복 없이 모은다.
 *
 * 해석은 서버에서 한 번에 해 두고 결과만 화면으로 내려보내기 위한 것이다. 챔피언
 * 카탈로그를 클라이언트로 끌어오면 170명이 통째로 번들에 실린다.
 */

/**
 * `[[미드/아리]]`, `[[미드/아리|표시할 글]]`을 매치업 문서 링크로 바꾼다.
 *
 * 편집자는 슬러그(`mid/ahri`)가 아니라 아는 이름(`미드/아리`)으로 쓴다. 해석은
 * 부르는 쪽이 맡는다 — 챔피언 카탈로그를 이 모듈로 끌어오면 클라이언트 번들에
 * 170명이 통째로 실린다.
 *
 * 해석되지 않은 링크는 지우지 않고 `MISSING_DOC_HREF`로 남겨 빨간 링크로 그린다.
 * 오타든 아직 없는 조합이든, 보이는 편이 낫다.
 */
export function collectWikiLinkTargets(body: string): string[] {
  const found = new Set<string>();
  mapOutsideCode(body, (chunk) => {
    for (const hit of chunk.matchAll(WIKI_LINK)) found.add(hit[1].trim());
    return chunk;
  });
  return [...found];
}

export function linkifyWikiLinks(
  body: string,
  resolve: (target: string) => WikiLinkTarget | null,
): string {
  return mapOutsideCode(body, (chunk) =>
    chunk.replace(WIKI_LINK, (_whole, rawTarget: string, rawLabel?: string) => {
      const target = rawTarget.trim();
      const label = (rawLabel ?? target).trim();
      const hit = resolve(target);
      const href = hit ? `/matchup/${hit.positionSlug}/${hit.championSlug}` : MISSING_DOC_HREF;
      return `[${label}](${href})`;
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
    .replace(WIKI_LINK, (_whole, target: string, label?: string) => (label ?? target).trim())
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(FOOTNOTE_REF, "")
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
