"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";

import type { WikiLinkMap } from "@/lib/wikiLink";
import { articleHref } from "@/lib/wikiTitle";

import { type DocSection, WikiDocument } from "./WikiDocument";
import styles from "./ArticleScreen.module.css";

type Viewer = { id: string; name: string; role: "member" | "admin" } | null;

type Props = {
  title: string;
  /** 본문. 이름 붙은 섹션은 3단계에서 붙는다. */
  body: string;
  revision: number;
  updatedAt: string | null;
  updatedBy: string | null;
  /** 승인 전 문서. 제안자와 운영자에게만 보이며 그 사실을 화면에 적는다. */
  proposed: boolean;
  /** 본문에 적힌 `[[...]]`를 서버가 미리 풀어 둔 결과. */
  wikiLinks: WikiLinkMap;
  viewer: Viewer;
};

/** 본문 섹션의 앵커. 매치업 문서의 `general`과 같은 자리다. */
const BODY_ID = "general";

/**
 * 일반 문서 한 장 (`docs/WIKI_EXPANSION.md` 1단계).
 *
 * 문서 골격은 매치업과 똑같은 `WikiDocument`를 쓴다. 목차 하나, 번호가 문서 전체를
 * 관통하는 것, 섹션이 곧 편집 단위인 것이 전부 그대로다 — 다른 것은 섹션 이름이
 * 어디서 오는가뿐인데, 지금 일반 문서에는 본문 하나뿐이라 그 차이도 아직 없다.
 *
 * 매치업 문서와 달리 Aside가 없다. 그릴 챔피언 아트가 없기 때문이고, 그 자리를 빈
 * 상자로 채우지 않는다 (블루프린트 5장 "의미 없는 장식").
 */
export function ArticleScreen({
  title,
  body,
  revision,
  updatedAt,
  updatedBy,
  proposed,
  wikiLinks,
  viewer,
}: Props) {
  const resolveLink = useCallback((target: string) => wikiLinks[target] ?? null, [wikiLinks]);

  const base = articleHref(title);
  const editHref = `${base}/edit`;

  const sections = useMemo<DocSection[]>(
    () => [
      {
        id: BODY_ID,
        title: "본문",
        badge: <span className="sticker sticker--cobalt">article</span>,
        badgePosition: "after",
        body,
        action: proposed ? undefined : (
          <Link
            href={viewer ? editHref : `/login?callbackUrl=${encodeURIComponent(editHref)}`}
            prefetch={false}
            className={`sticker ${styles.editButton}`}
          >
            편집
          </Link>
        ),
        empty: <p className={styles.empty}>아직 본문이 없습니다.</p>,
      },
    ],
    [body, editHref, proposed, viewer],
  );

  return (
    <div className={styles.screen}>
      <div className="shell">
        <nav className={styles.crumbs} aria-label="현재 위치">
          <Link href="/wiki" className={styles.crumbLink}>
            위키
          </Link>
          <span aria-hidden="true"> / </span>
          <span className={styles.crumbCurrent}>{title}</span>
        </nav>

        <header className={styles.documentHeader}>
          <p className={`mono ${styles.documentKicker}`}>WIKI ARTICLE</p>
          <h1 className={`display ${styles.documentTitle}`}>{title}</h1>
        </header>

        {/*
          승인 전 문서는 목록·검색·링크 어디에도 없다. 주소를 아는 사람만 여기 닿으므로,
          지금 보고 있는 것이 아직 문서가 아니라는 사실을 화면이 직접 말해야 한다.
        */}
        {proposed && (
          <p className={styles.proposed}>
            <span className="sticker sticker--gum">검토 대기</span> 아직 만들어지지 않은 문서입니다.
            운영자가 승인하면 이 이름으로 게시됩니다.
          </p>
        )}

        <div className={`${styles.paper} on-paper`}>
          <WikiDocument sections={sections} resolveLink={resolveLink} />
        </div>

        {!proposed && (
          <p className={`mono ${styles.meta}`}>
            <Link href={`${base}/history`} className={styles.historyLink}>
              r{revision} 역사
            </Link>
            <span aria-hidden="true">|</span>
            <span>{formatDate(updatedAt)} 갱신</span>
            {updatedBy && (
              <>
                <span aria-hidden="true">|</span>
                <span>{updatedBy}</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
