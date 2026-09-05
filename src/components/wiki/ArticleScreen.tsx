"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";

import type { CategoryMember, CategoryNode, CategoryView } from "@/lib/wikiStore";
import type { WikiLinkMap } from "@/lib/wikiLink";
import { collectWikiLinkTitles, parseCategoryName } from "@/lib/wikiMarkup";
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
  /** 이 문서 자체가 분류(`분류:이름`)일 때만 온다 — 그 분류에 속한 문서들. */
  categoryMembers?: CategoryView;
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
  categoryMembers,
  viewer,
}: Props) {
  const resolveLink = useCallback((target: string) => wikiLinks[target] ?? null, [wikiLinks]);

  const base = articleHref(title);
  const editHref = `${base}/edit`;

  /*
   * 분류 태그는 본문에 그리지 않는다(`linkifyWikiLinks`가 지운다). 여기서 따로
   * 뽑아 문서 하단에 태그 줄로 보여준다 — namuwiki가 분류를 다루는 방식과 같다.
   */
  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const linkTitle of collectWikiLinkTitles(body)) {
      const name = parseCategoryName(linkTitle);
      if (name) names.add(name);
    }
    return [...names];
  }, [body]);

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

        {categories.length > 0 && (
          <p className={styles.categories}>
            <span className={styles.categoriesLabel}>분류</span>
            {categories.map((name) => (
              <Link key={name} href={articleHref(`분류:${name}`)} className={styles.categoryTag}>
                {name}
              </Link>
            ))}
          </p>
        )}

        {/*
          이 문서 자체가 분류(`분류:이름`)일 때만 온다. 손으로 쓴 본문 아래에 그 분류에
          속한 문서를 자동으로 이어 붙인다 — namuwiki의 분류 문서와 같은 동작이다.
          하위분류는 끝까지 재귀적으로 펼친다(`getCategoryView`가 그렇게 읽어 온다).
        */}
        {categoryMembers && (categoryMembers.docs.length > 0 || categoryMembers.subcategories.length > 0) && (
          <section className={styles.memberList} aria-label="이 분류의 문서">
            <p className={styles.memberListTitle}>이 분류의 문서</p>
            {categoryMembers.docs.length > 0 && <CategoryMemberDocs docs={categoryMembers.docs} />}
            {categoryMembers.subcategories.map((sub) => (
              <CategoryMemberBranch key={sub.name} node={sub} />
            ))}
          </section>
        )}

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

/** 분류에 속한 문서 목록 한 줄. */
function CategoryMemberDocs({ docs }: { docs: CategoryMember[] }) {
  return (
    <ul className={styles.memberRows}>
      {docs.map((doc) => (
        <li key={doc.titleKey}>
          <Link href={articleHref(doc.title)} className={styles.memberRow}>
            {doc.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 하위분류 한 갈래. 자기 문서를 그리고, 자기 하위분류를 재귀적으로 그린다. */
function CategoryMemberBranch({ node }: { node: CategoryNode }) {
  return (
    <div className={styles.memberSub}>
      <p className={styles.memberSubLabel}>
        <Link href={articleHref(`분류:${node.name}`)} className={styles.categoryTag}>
          {node.name}
        </Link>
      </p>
      {node.docs.length > 0 && <CategoryMemberDocs docs={node.docs} />}
      {node.subcategories.map((sub) => (
        <CategoryMemberBranch key={sub.name} node={sub} />
      ))}
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
