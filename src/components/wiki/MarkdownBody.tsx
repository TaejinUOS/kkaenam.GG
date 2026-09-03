import Markdown from "markdown-to-jsx";
import type { AnchorHTMLAttributes } from "react";

/**
 * 위키 섹션 본문의 공용 마크다운 렌더러.
 *
 * `disableParsingRawHTML: true`라 원문에 섞인 HTML 태그는 항상 글자 그대로
 * 이스케이프되어 보인다 — `dangerouslySetInnerHTML`을 전혀 쓰지 않으므로 이
 * 렌더러 자체에 스크립트 삽입 경로가 없다 (PRD 10 "스크립트 삽입 공격 방지").
 *
 * 링크는 `http(s)`만 허용한다. 그 외 스킴(`javascript:`, `data:` 등)은 href가
 * 제거된 채로 렌더된다 (라이브러리 내장 sanitizer가 1차로 거르고, 여기서
 * 스킴을 한 번 더 확인한다).
 *
 * 문서 안 제목(h1/h2)은 섹션 제목(`WikiPanel`의 h3)보다 낮은 단계로 눌러
 * 페이지에 h1이 여러 번 나타나지 않게 한다.
 */
export function MarkdownBody({ text }: { text: string }) {
  if (!text.trim()) return null;

  return (
    <Markdown
      options={{
        disableParsingRawHTML: true,
        overrides: {
          a: { component: SafeLink },
          h1: { component: "h4" },
          h2: { component: "h4" },
        },
      }}
    >
      {text}
    </Markdown>
  );
}

function SafeLink({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const safeHref = typeof href === "string" && /^https?:\/\//i.test(href) ? href : undefined;
  return (
    <a {...rest} href={safeHref} target="_blank" rel="noopener noreferrer nofollow ugc">
      {children}
    </a>
  );
}
