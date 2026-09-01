"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { SelectionData } from "@/data/selection";
import { prefersReducedMotion } from "@/lib/motion";
import { buildQuery } from "@/lib/url";

import { ContactSheet } from "./ContactSheet";
import styles from "./SelectionScreen.module.css";

/** 블루프린트 6.2: 포스터 수에 따라 데스크톱 12열을 다르게 나눈다. */
const POSTER_WEIGHTS: Record<number, number[]> = {
  1: [8],
  2: [7, 5],
  3: [5, 4, 3],
};

function weightsFor(count: number): number[] {
  return POSTER_WEIGHTS[count] ?? Array.from({ length: count }, () => 1);
}

type Props = {
  data: SelectionData;
  defaultPosition: string;
  patch: string;
};

export function SelectionScreen({ data, defaultPosition, patch }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sheetRef = useRef<HTMLDivElement>(null);
  /** 카테고리를 방금 선택했을 때만 Contact Sheet로 스크롤한다. */
  const shouldScroll = useRef(false);

  const positionParam = searchParams.get("position");
  const positionSlug = data.positions.some((p) => p.slug === positionParam)
    ? (positionParam as string)
    : defaultPosition;

  const categoryList = data.categories[positionSlug] ?? [];
  const categoryParam = searchParams.get("category");
  const categorySlug = categoryList.some((c) => c.slug === categoryParam) ? categoryParam : null;

  const activePosition = data.positions.find((p) => p.slug === positionSlug)!;
  const activeCategory = categoryList.find((c) => c.slug === categorySlug) ?? null;

  const champions = useMemo(
    () => (categorySlug ? (data.champions[`${positionSlug}/${categorySlug}`] ?? []) : []),
    [data.champions, positionSlug, categorySlug],
  );

  const push = useCallback(
    (patchParams: Record<string, string | null>) => {
      router.replace(`${pathname}${buildQuery(searchParams.toString(), patchParams)}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  /** PRD 5.1: 포지션을 바꾸면 이전 카테고리와 검색어를 초기화한다. */
  const selectPosition = useCallback(
    (slug: string) => {
      if (slug === positionSlug) return;
      push({ position: slug, category: null, q: null });
    },
    [positionSlug, push],
  );

  const selectCategory = useCallback(
    (slug: string) => {
      shouldScroll.current = true;
      push({ category: slug, q: null });
    },
    [push],
  );

  // 블루프린트 7장: 카테고리 선택 후 Contact Sheet를 공개하며 그 위치로 이동한다.
  useEffect(() => {
    if (!shouldScroll.current || !categorySlug) return;
    shouldScroll.current = false;
    sheetRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [categorySlug]);

  const weights = weightsFor(categoryList.length);
  const isSingle = categoryList.length === 1;

  return (
    <div className={styles.screen}>
      <div className="shell">
        {/* ------------------------------------------------------ 헤드라인 */}
        <section className={styles.masthead}>
          <div className={styles.mastheadMain}>
            <p className="section-index">01 / 상대할 챔피언 고르기</p>
            <h1 className={`display ${styles.headline}`}>누굴 상대해?</h1>
          </div>

          {/* 목업의 바코드 티켓. 현재 포지션·패치·카테고리를 한 줄로 보여 준다. */}
          <div className={styles.ticket} aria-hidden="true">
            <p className={`mono ${styles.ticketLine}`}>
              {activePosition.code} / PATCH {patch} / {activeCategory?.name ?? "CATEGORY"}
            </p>
            <div className={styles.barcode} />
          </div>
        </section>

        {/* ----------------------------------------------------- 포지션 탭 */}
        <nav className={styles.positions} aria-label="포지션 선택">
          <ul className={styles.positionList}>
            {data.positions.map((position) => {
              const current = position.slug === positionSlug;
              return (
                <li key={position.slug}>
                  <button
                    type="button"
                    className={`${styles.positionTab} ${current ? styles.positionTabCurrent : ""}`}
                    aria-pressed={current}
                    onClick={() => selectPosition(position.slug)}
                  >
                    <span className={styles.positionName}>{position.name}</span>
                    <span className={`mono ${styles.positionCode}`}>{position.code}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* -------------------------------------------------- 카테고리 포스터 */}
      <div className="shell">
        <section aria-label={`${activePosition.name} 카테고리`}>
          <div
            className={`${styles.posterGroup} ${isSingle ? styles.posterGroupSingle : ""}`}
            /* 포지션이 바뀌면 key가 바뀌어 포스터 세트가 새로 그려진다. */
            key={positionSlug}
          >
            {categoryList.map((category, index) => {
              const current = category.slug === categorySlug;
              return (
                <button
                  key={category.slug}
                  type="button"
                  className={`${styles.poster} ${current ? styles.posterCurrent : ""}`}
                  style={{ ["--w" as string]: weights[index] ?? 1 }}
                  aria-pressed={current}
                  onClick={() => selectCategory(category.slug)}
                >
                  <span className={`${styles.posterFrame} halftone`}>
                    {/*
                      포스터는 장식이 아니라 카테고리 선택 자체이므로, 대체 텍스트는
                      버튼 레이블이 담당하고 이미지는 배경으로 둔다.
                    */}
                    <img
                      className={styles.posterImage}
                      src={category.coverImage}
                      alt=""
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </span>

                  {/* 카테고리명은 이미지 바깥으로 튀어나오게 배치한다 (블루프린트 6.2). */}
                  <span className={`display ${styles.posterLabel}`}>{category.name}</span>

                  <span className={`mono ${styles.posterMeta}`}>
                    <span className={styles.posterRole}>{category.role}</span>
                    <span>{category.championCount}명</span>
                  </span>
                </button>
              );
            })}

            {/* 포스터가 하나인 원딜은 남는 4열을 설명 영역으로 채운다. */}
            {isSingle && (
              <div className={styles.singleNote}>
                <p className="section-index">02 / 카테고리</p>
                <p className={styles.singleNoteBody}>
                  {activePosition.name}은 카테고리를 나누지 않고 하나로 모읍니다. 포스터를 선택하면
                  {" "}
                  {categoryList[0]?.championCount}명의 챔피언이 아래에 펼쳐집니다.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ------------------------------------------------ 챔피언 Contact Sheet */}
      <div ref={sheetRef} className={styles.sheetAnchor}>
        {activeCategory ? (
          <ContactSheet
            key={`${positionSlug}/${activeCategory.slug}`}
            positionSlug={positionSlug}
            positionName={activePosition.name}
            category={activeCategory}
            champions={champions}
          />
        ) : (
          <div className="shell">
            <p className={styles.hint}>
              <span className="sticker sticker--acid">다음</span>
              위에서 카테고리를 선택하면 해당 챔피언만 펼쳐집니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
