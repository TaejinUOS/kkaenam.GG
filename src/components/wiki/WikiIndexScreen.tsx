"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { WikiIndexData } from "@/data/wikiIndex";
import { prefersReducedMotion } from "@/lib/motion";
import { buildQuery, matchesName, normalizeQuery } from "@/lib/url";
import { articleHref } from "@/lib/wikiTitle";

import styles from "./WikiIndexScreen.module.css";

/** 최근 바뀐 문서 한 줄. 상대 시각은 서버에서 미리 지어 넘긴다 (수화 불일치 방지). */
export type RecentRow = {
  id: string;
  /** "3시간", "어제"처럼 이미 사람이 읽을 꼴로 지어진 값. */
  when: string;
  /** `<time dateTime>`에 넣을 원본 시각. */
  at: string;
  title: string;
  /** 어느 섹션이 바뀌었는지. 공통 섹션이면 null. */
  section: string | null;
  href: string;
  /** 상대법·사전처럼 어느 갈래의 문서인지. */
  branch: string;
};

/** "손이 필요한 곳"의 숫자 한 장. 커버를 씌우지 않고 숫자를 주인공으로 둔다. */
export type WorkCounter = {
  key: string;
  count: number;
  label: string;
  href: string;
};

type Props = {
  data: WikiIndexData;
  docCount: number;
  weekEditCount: number;
  recent: RecentRow[];
  counters: WorkCounter[];
};

/**
 * 블루프린트 6.2와 같은 조판. 표지가 세 장이므로 12열을 5/4/3으로 나눈다.
 *
 * 관문이 늘어도 이 표를 늘리지 않는다 — 표지는 `COVER_SLOTS`장으로 고정이고,
 * 남는 관문은 아래 분류 나무에 이름으로 선다 (`docs/WIKI_EXPANSION.md` "회전이 아니라 편성").
 */
const POSTER_WEIGHTS: Record<number, number[]> = {
  1: [8],
  2: [7, 5],
  3: [5, 4, 3],
};

function weightsFor(count: number): number[] {
  return POSTER_WEIGHTS[count] ?? Array.from({ length: count }, () => 1);
}

/** 검색 결과에 한 번에 보여 주는 최대 줄 수. 색인은 훑는 것이지 읽는 것이 아니다. */
const SEARCH_LIMIT = 12;

export function WikiIndexScreen({ data, docCount, weekEditCount, recent, counters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);
  /** 관문을 방금 골랐을 때만 펼쳐진 목록으로 스크롤한다. */
  const shouldScroll = useRef(false);

  const [query, setQuery] = useState("");

  const portalKey = searchParams.get("분류");
  const activePortal =
    data.cover.find((p) => p.key === portalKey) ??
    data.shelf.find((p) => p.key === portalKey) ??
    null;

  const push = useCallback(
    (patch: Record<string, string | null>) => {
      router.replace(`${pathname}${buildQuery(searchParams.toString(), patch)}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const selectPortal = useCallback(
    (key: string) => {
      shouldScroll.current = true;
      /* 같은 관문을 다시 누르면 접는다. 목차에서 펼침은 열고 닫는 일이지 이동이 아니다. */
      push({ 분류: key === portalKey ? null : key });
    },
    [portalKey, push],
  );

  useEffect(() => {
    if (!shouldScroll.current || !activePortal) return;
    shouldScroll.current = false;
    panelRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }, [activePortal]);

  const needle = normalizeQuery(query);
  const results = useMemo(() => {
    if (!needle) return [];
    return data.search.filter((entry) => matchesName(needle, entry.match)).slice(0, SEARCH_LIMIT);
  }, [data.search, needle]);

  const weights = weightsFor(data.cover.length);

  return (
    <div className={styles.screen}>
      <div className="shell">
        {/* -------------------------------------------------------- 마스트헤드 */}
        <section className={styles.masthead}>
          <h1 className={`display ${styles.headline}`}>뭘 찾아?</h1>
          {/*
            선택 화면의 바코드 티켓과 같은 자리. 여기 담기는 것은 포지션·패치가 아니라
            "이 위키가 지금 얼마나 크고, 지난 이레 동안 얼마나 움직였는가"다.
          */}
          <div className={styles.mastheadSide}>
            <p className={`mono ${styles.ticket}`}>
              <span className="sr-only">문서 </span>DOCS {docCount}
              <span className={styles.ticketSlash} aria-hidden="true">
                /
              </span>
              <span className="sr-only">최근 7일 편집 </span>7D {weekEditCount}
            </p>
            {/*
              찾다가 없으면 그 자리에서 쓰기 시작할 수 있어야 한다. 목차의 일은 있는
              것을 보여 주는 것이지만, 없는 것을 만드는 문도 여기 있는 편이 낫다.
            */}
            <Link href="/wiki/new" className={`btn ${styles.newDoc}`} prefetch={false}>
              새 문서 제안
            </Link>
          </div>
        </section>

        <div className={styles.columns}>
          {/* ================================================ 왼쪽: 인쇄된 것 */}
          <div className={styles.printed}>
            <p className={`section-index ${styles.printedIndex}`}>01 — 이번 호 표지</p>

            <div className={styles.posterGroup}>
              {data.cover.map((portal, index) => {
                const current = portal.key === portalKey;
                return (
                  <button
                    key={portal.key}
                    type="button"
                    className={`${styles.poster} ${current ? styles.posterCurrent : ""}`}
                    style={{ ["--w" as string]: weights[index] ?? 1 }}
                    aria-pressed={current}
                    onClick={() => selectPortal(portal.key)}
                  >
                    <span className={styles.posterFrameWrap}>
                      <span className={styles.posterFrame}>
                        <span className={styles.posterFrameInner}>
                          {/*
                            커버는 챔피언 아트가 아니라 도해다. 대체 텍스트는 버튼
                            레이블이 담당하므로 이미지 자체는 배경으로 둔다.
                          */}
                          <img
                            className={styles.posterImage}
                            src={portal.coverImage}
                            alt=""
                            loading={index === 0 ? "eager" : "lazy"}
                            decoding="async"
                          />
                        </span>
                      </span>
                    </span>

                    {/* 관문명은 이미지 바깥으로 튀어나온다 (블루프린트 6.2). */}
                    <span className={`display ${styles.posterLabel}`}>{portal.label}</span>

                    <span className={styles.posterMeta}>
                      {/*
                        문서가 0인 관문에 `문서 0`을 붙이지 않는다. 큰 커버 아래 0이
                        놓이면 죽은 사이트로 보이는데, 이 관문은 죽은 것이 아니라
                        아직 아무도 안 쓴 것이다.
                      */}
                      <span className={`mono ${styles.posterCount}`}>
                        {portal.docCount > 0 ? `문서 ${portal.docCount}` : "아직 없음"}
                      </span>
                      <span className={styles.posterBlurb}>{portal.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className={`hand ${styles.posterHint}`} aria-hidden="true">
              ↓ 고르면 이 아래로 목록이 펼쳐진다
            </p>

            {/* -------------------------------------------------- 분류 펼침 */}
            <div ref={panelRef} className={styles.panelAnchor}>
              {activePortal && (
                <section className={styles.panel} aria-label={`${activePortal.label} 분류의 문서`}>
                  <div className={styles.panelHead}>
                    <h2 className={`display ${styles.panelTitle}`}>{activePortal.label}</h2>
                    <p className={`mono ${styles.panelPath}`}>/wiki?분류={activePortal.key}</p>
                  </div>

                  {activePortal.docs.length === 0 && activePortal.subcategories.length === 0 ? (
                    /*
                      빈 화면을 막다른 길로 두지 않고 무엇을 하면 여기 문서가 모이는지 적는다.
                      위키에서 비어 있음은 실패가 아니라 초대다.
                    */
                    <p className={styles.panelEmpty}>
                      아직 이 분류에 문서가 없습니다. 문서 본문에{" "}
                      <code className={styles.code}>[[분류:{activePortal.key}]]</code>를 적으면 그
                      문서가 여기에 모입니다.
                    </p>
                  ) : (
                    <>
                      {activePortal.docs.length > 0 && (
                        <ul className={styles.rows}>
                          {activePortal.docs.map((doc) => (
                            <li key={doc.titleKey}>
                              <Link href={articleHref(doc.title)} className={styles.row}>
                                <span className={styles.rowTitle}>{doc.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}

                      {activePortal.subcategories.map((sub) => (
                        <div key={sub.name} className={styles.branch}>
                          <p className={styles.branchLabel}>
                            <Link href={articleHref(`분류:${sub.name}`)} className={styles.branchLink}>
                              {sub.name}
                            </Link>
                          </p>
                          <ul className={styles.rows}>
                            {sub.docs.map((doc) => (
                              <li key={doc.titleKey}>
                                <Link href={articleHref(doc.title)} className={styles.row}>
                                  <span className={styles.rowTitle}>{doc.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </>
                  )}
                </section>
              )}
            </div>
          </div>

          {/* ============================================== 오른쪽: 덧칠한 메모 */}
          <div className={styles.side}>
            {/*
              검색이 실제 1순위 입구다. 스크롤 없이 보이는 자리에 두고, 결과는
              드롭다운으로 덮지 않고 아래 열의 내용을 대체한다 — 종이 색인을 넘긴 것처럼.

              열에서 떼어 낸 형제로 두는 이유는 모바일 때문이다. 한 열로 접히면
              `검색 → 관문 → 최근 → 일감` 순으로 쌓여야 하는데, 검색이 열 안에 들어
              있으면 최근·일감과 함께 관문 위나 아래로 통째로 움직인다.
            */}
            <form className={styles.searchForm} role="search" onSubmit={(e) => e.preventDefault()}>
              <label className="sr-only" htmlFor="wiki-search">
                문서 이름으로 찾기
              </label>
              <span className={styles.searchIcon} aria-hidden="true">
                <SearchGlyph />
              </span>
              <input
                id="wiki-search"
                type="search"
                className={styles.searchInput}
                placeholder="문서 이름"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
            </form>

            <aside
              className={`${styles.rail} ${needle ? styles.railSearching : ""}`}
              aria-label="검색 결과와 최근 변경"
            >
              {needle ? (
                <section aria-label="검색 결과">
                  <p className={`section-index ${styles.railIndex}`}>찾은 문서 {results.length}</p>
                  {results.length === 0 ? (
                    <p className={styles.railEmpty}>
                      그런 이름의 문서가 없습니다. 매치업 문서는{" "}
                      <code className={styles.code}>아리 상대법</code>처럼 적습니다.{" "}
                      {/*
                        찾았는데 없다는 것은 그 문서가 필요하다는 말이기도 하다.
                        친 이름을 그대로 들고 제안 화면으로 보낸다.
                      */}
                      <Link
                        href={`/wiki/new?title=${encodeURIComponent(query.trim())}`}
                        className={styles.railCreate}
                        prefetch={false}
                      >
                        「{query.trim()}」 문서를 새로 쓰기 →
                      </Link>
                    </p>
                  ) : (
                    <ul className={styles.rows}>
                      {results.map((entry) => (
                        <li key={entry.href}>
                          <Link href={entry.href} className={styles.row}>
                            <span className={styles.rowTitle}>{entry.title}</span>
                            <span className={`mono ${styles.rowBranch}`}>{entry.branch}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : (
                <>
                  {/* -------------------------------------- 02 최근 바뀐 문서 */}
                  <section aria-label="최근 바뀐 문서">
                    <p className={`section-index ${styles.railIndex}`}>02 — 최근 바뀐 문서</p>
                    {recent.length === 0 ? (
                      <p className={styles.railEmpty}>
                        아직 반영된 편집이 없습니다. 첫 편집이 여기 남습니다.
                      </p>
                    ) : (
                      <>
                        <ul className={styles.rows}>
                          {recent.map((change) => (
                            <li key={change.id}>
                              <Link href={change.href} className={styles.row}>
                                <time className={`mono ${styles.rowWhen}`} dateTime={change.at}>
                                  {change.when}
                                </time>
                                <span className={styles.rowTitle}>
                                  {change.title}
                                  {change.section && (
                                    <span className={styles.rowSection}> › {change.section}</span>
                                  )}
                                </span>
                                <span className={`mono ${styles.rowBranch}`}>{change.branch}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link href="/wiki/recent" className={styles.railMore}>
                          전부 <span aria-hidden="true">→</span>
                        </Link>
                      </>
                    )}
                  </section>

                  {/* -------------------------------------- 03 손이 필요한 곳 */}
                  <section aria-label="손이 필요한 곳" className={styles.work}>
                    <p className={`section-index ${styles.railIndex}`}>03 — 손이 필요한 곳</p>
                    {/*
                      커버를 씌우지 않는다. 여기서 값을 가진 것은 그림이 아니라 숫자이고,
                      그 숫자가 줄어드는 것을 보는 일이 목적이다.
                    */}
                    <ul className={styles.counters}>
                      {counters.map((counter) => (
                        <li key={counter.key}>
                          <Link href={counter.href} className={styles.counter}>
                            <span className={`mono ${styles.counterNumber}`}>{counter.count}</span>
                            <span className={styles.counterLabel}>{counter.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* ==================================================== 04 분류 전부 */}
      <div className="shell">
        <section className={styles.tree} aria-label="분류 전부">
          <p className={`section-index ${styles.treeIndex}`}>04 — 분류 전부</p>
          <div className={styles.treeGrid}>
            {data.tree.map((branch) => (
              <div key={branch.label} className={styles.branch}>
                <p className={styles.branchLabel}>
                  {branch.href ? (
                    <Link href={branch.href} className={styles.branchLink}>
                      {branch.label}
                    </Link>
                  ) : (
                    branch.label
                  )}
                </p>
                <ul className={styles.branchItems}>
                  {branch.items.map((item) => (
                    <li key={item.label}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={`${styles.branchItem} ${
                            item.pending ? styles.branchItemPending : ""
                          }`}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          className={`${styles.branchItem} ${
                            item.pending ? styles.branchItemPending : ""
                          }`}
                        >
                          {item.label}
                        </span>
                      )}

                      {/* 하위분류. 관문 밑에 한 단계만 중첩되어 보인다(`getCategoryView`가 그 깊이까지만 읽는다). */}
                      {item.children && item.children.length > 0 && (
                        <ul className={styles.branchChildren}>
                          {item.children.map((child) => (
                            <li key={child.label}>
                              {child.href ? (
                                <Link
                                  href={child.href}
                                  className={`${styles.branchChildItem} ${
                                    child.pending ? styles.branchItemPending : ""
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              ) : (
                                <span
                                  className={`${styles.branchChildItem} ${
                                    child.pending ? styles.branchItemPending : ""
                                  }`}
                                >
                                  {child.label}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                {branch.emptyNote && <p className={styles.branchNote}>{branch.emptyNote}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 21 21" strokeLinecap="square" />
    </svg>
  );
}
