"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useInkTransition } from "@/components/InkTransition";
import type { CategoryView, ChampionChip } from "@/data/selection";
import { buildQuery, matchesName, normalizeQuery } from "@/lib/url";

import styles from "./ContactSheet.module.css";

type Props = {
  positionSlug: string;
  positionName: string;
  category: CategoryView;
  champions: ChampionChip[];
};

export function ContactSheet({ positionSlug, positionName, category, champions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate, overlay } = useInkTransition();

  /*
   * 입력은 즉시 반영하고 URL 반영만 늦춘다. 매 글자마다 history를 갱신하면
   * 뒤로 가기가 글자 단위로 되돌아가 쓰기 어려워진다.
   */
  const urlQuery = searchParams.get("q") ?? "";
  const [term, setTerm] = useState(urlQuery);

  useEffect(() => {
    setTerm(urlQuery);
    // 포지션·카테고리가 바뀌어 컴포넌트가 새로 마운트될 때 URL 값을 따른다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionSlug, category.slug]);

  useEffect(() => {
    if (term === urlQuery) return;
    const id = setTimeout(() => {
      router.replace(`${pathname}${buildQuery(searchParams.toString(), { q: term || null })}`, {
        scroll: false,
      });
    }, 250);
    return () => clearTimeout(id);
  }, [term, urlQuery, pathname, router, searchParams]);

  const needle = normalizeQuery(term);
  const results = useMemo(
    () => champions.filter((c) => matchesName(needle, c.name, c.slug)),
    [champions, needle],
  );

  return (
    <section className={`shell ${styles.sheet}`} aria-label="챔피언 선택">
      {/* --------------------------------------------------- 현재 선택 표시 */}
      <header className={styles.head}>
        <div className={styles.headMain}>
          <h2 className={styles.breadcrumb}>
            <span className="sticker">{positionName}</span>
            <span aria-hidden="true" className={styles.arrow}>
              →
            </span>
            <span className="sticker sticker--acid">{category.name}</span>
            <span className={`mono ${styles.count}`}>
              {needle ? `${results.length} / ${champions.length}` : `${champions.length}`}명
            </span>
          </h2>
        </div>

        <label className={styles.search}>
          <span className="sr-only">
            {positionName} {category.name} 안에서 챔피언 이름 검색
          </span>
          <input
            className={styles.searchInput}
            type="search"
            value={term}
            placeholder="상대법 검색"
            autoComplete="off"
            onChange={(event) => setTerm(event.target.value)}
          />
          <span className={styles.searchIcon} aria-hidden="true" />
        </label>
      </header>

      {/* ------------------------------------------------- 챔피언 아이콘 그리드 */}
      {results.length > 0 ? (
        <ul className={styles.grid}>
          {results.map((champion) => (
            <li key={champion.slug}>
              <button
                type="button"
                className={styles.pick}
                onClick={(event) =>
                  navigate(`/matchup/${positionSlug}/${champion.slug}`, event.currentTarget)
                }
              >
                <span className={styles.pickFrame}>
                  <img
                    className={styles.pickImage}
                    src={champion.iconUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={120}
                    height={120}
                  />
                  {/* 이름은 아이콘 아래가 아니라 이미지 하단을 가로지르는 종이 라벨이다. */}
                  <span className={styles.pickName}>{champion.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            &lsquo;{term}&rsquo;와 일치하는 챔피언이 없습니다.
          </p>
          <p className={styles.emptyBody}>
            {positionName} {category.name}에는 {champions.length}명이 있습니다. 검색어를 지우면 전체
            목록이 다시 나타납니다.
          </p>
          <button type="button" className="btn btn--acid" onClick={() => setTerm("")}>
            검색어 지우기
          </button>
        </div>
      )}

      {overlay}
    </section>
  );
}
