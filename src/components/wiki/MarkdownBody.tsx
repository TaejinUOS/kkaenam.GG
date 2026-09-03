import Markdown from "markdown-to-jsx";
import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

import {
  FOOTNOTE_HREF,
  MISSING_DOC_HREF,
  type Footnote,
  type WikiLinkTarget,
  extractFootnotes,
  linkifyFootnotes,
  linkifyWikiLinks,
} from "@/lib/wikiMarkup";

import styles from "./MarkdownBody.module.css";

/**
 * 위키 본문의 공용 마크다운 렌더러.
 *
 * `disableParsingRawHTML: true`라 원문에 섞인 HTML 태그는 항상 글자 그대로
 * 이스케이프되어 보인다 — `dangerouslySetInnerHTML`을 전혀 쓰지 않으므로 이
 * 렌더러 자체에 스크립트 삽입 경로가 없다 (PRD 10 "스크립트 삽입 공격 방지").
 *
 * 위키 전용 문법(각주 `[^가]`, 위키링크 `[[미드/아리]]`)은 파싱 전에 표준 마크다운으로
 * 바뀐 뒤 들어온다. 자세한 것은 `lib/wikiMarkup.ts`.
 *
 * 이 컴포넌트는 클라이언트 훅을 쓰지 않는다. 서버 컴포넌트인 역사·검토 화면이
 * 그대로 부를 수 있어야 하기 때문이다.
 */
type Props = {
  text: string;
  /**
   * 문서 단위로 미리 뽑아 둔 각주. 본문이 제목마다 쪼개져 들어올 때 필요하다 —
   * 글 끝에 모아 둔 정의가 앞쪽 소제목의 참조에도 닿아야 한다.
   * 주지 않으면 `text`에서 직접 뽑는다.
   */
  footnotes?: Footnote[];
  /** 위키링크 해석기. 주지 않으면 모든 `[[...]]`가 없는 문서로 표시된다. */
  resolveLink?: (target: string) => WikiLinkTarget | null;
};

const NO_LINK = () => null;

export function MarkdownBody({ text, footnotes, resolveLink = NO_LINK }: Props) {
  if (!text.trim()) return null;

  const source = footnotes ? { body: text, notes: footnotes } : extractFootnotes(text);
  const markdown = linkifyFootnotes(linkifyWikiLinks(source.body, resolveLink), source.notes);

  return (
    <Markdown
      options={{
        disableParsingRawHTML: true,
        overrides: {
          a: { component: makeLink(source.notes, resolveLink) },
          /*
           * 문서 안 제목은 화면의 제목 체계보다 낮은 단계로 눌러 h1이 여러 번
           * 나타나지 않게 한다. 통합 문서에서는 제목이 이미 개요로 뽑혀 나가므로
           * 여기에 남는 것은 setext 제목처럼 개요 파서가 다루지 않는 경우뿐이다.
           */
          h1: { component: "h5" },
          h2: { component: "h5" },
          h3: { component: "h6" },
        },
      }}
    >
      {markdown}
    </Markdown>
  );
}

/**
 * 링크 렌더러. 링크를 네 갈래로 나눈다.
 *
 * 갈래마다 색이 다른 것은 장식이 아니다. 같은 밑줄이라도 문서 안으로 들어가는지,
 * 사이트를 떠나는지, 아직 없는 문서인지에 따라 누르기 전에 알아야 할 것이 다르다.
 */
function makeLink(notes: Footnote[], resolveLink: (t: string) => WikiLinkTarget | null) {
  const byIndex = new Map(notes.map((note) => [note.index, note]));

  return function WikiLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    // 1. 각주 — 이동하지 않고 그 자리에 내용을 띄운다.
    if (typeof href === "string" && href.startsWith(FOOTNOTE_HREF)) {
      const note = byIndex.get(Number(href.slice(FOOTNOTE_HREF.length)));
      if (note) return <Annotation note={note} resolveLink={resolveLink} />;
    }

    // 2. 아직 없는 문서 — 이동할 곳이 없으므로 링크로 만들지 않는다.
    if (href === MISSING_DOC_HREF) {
      return (
        <span className={styles.missing} title="아직 없는 문서입니다">
          {children}
        </span>
      );
    }

    // 3. 사이트 안 — 새 탭을 열지 않고 클라이언트 이동한다.
    if (typeof href === "string" && href.startsWith("/")) {
      return (
        <Link href={href} className={styles.internal} {...rest}>
          {children}
        </Link>
      );
    }

    // 4. 바깥 — http(s)만 허용한다. 그 밖의 스킴(javascript:, data:)은 href를 지운다.
    const external = typeof href === "string" && /^https?:\/\//i.test(href) ? href : undefined;
    if (!external) {
      // 같은 문서 안 앵커(#...)는 그대로 둔다. 편집자가 직접 거는 상호 참조다.
      const anchor = typeof href === "string" && href.startsWith("#") ? href : undefined;
      return (
        <a {...rest} href={anchor} className={styles.internal}>
          {children}
        </a>
      );
    }

    return (
      <a
        {...rest}
        href={external}
        className={styles.external}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
      >
        {children}
      </a>
    );
  };
}

/**
 * 각주 — 마우스를 올리거나 초점이 닿으면 그 자리에 내용이 뜬다.
 *
 * 자바스크립트를 쓰지 않는다. 표시는 CSS의 `:hover`·`:focus-within`이 맡으므로 이
 * 컴포넌트가 서버에서 그려져도 동작한다. 손가락으로 쓰는 화면에는 hover가 없어
 * 표식을 버튼으로 두었다 — 한 번 누르면 초점이 닿아 같은 내용이 뜬다.
 *
 * 숨어 있을 때도 `opacity`로만 가린다. `display: none`으로 지우면 화면 낭독기가
 * 각주 내용을 아예 읽지 못한다.
 */
function Annotation({
  note,
  resolveLink,
}: {
  note: Footnote;
  resolveLink: (t: string) => WikiLinkTarget | null;
}) {
  return (
    <span className={styles.footnote}>
      <button type="button" className={styles.footnoteMark} aria-label={`각주 ${note.index}`}>
        [{note.index}]
      </button>
      <span role="note" className={styles.footnotePopup}>
        <Markdown
          options={{
            disableParsingRawHTML: true,
            forceInline: true,
            overrides: { a: { component: makeLink([], resolveLink) } },
          }}
        >
          {linkifyWikiLinks(note.body, resolveLink)}
        </Markdown>
      </span>
    </span>
  );
}
