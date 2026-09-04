import type { Metadata } from "next";
import Link from "next/link";

import { allChampions, getCategoriesFor, getPosition, positions } from "@/data/champions";
import { DEFAULT_POSITION_SLUG } from "@/data/taxonomy";
import { placeChampionAction, unplaceChampionAction } from "@/lib/actions/taxonomyActions";
import { requirePageAdmin } from "@/lib/authGuard";
import { getTaxonomy } from "@/lib/taxonomyStore";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "분류 편집", robots: { index: false, follow: false } };

/** 방금 한 조작의 결과. 배치는 눈에 잘 안 띄는 변화라 한 줄로 확인해 준다. */
const DONE_LABEL: Record<string, string> = {
  placed: "배치했습니다.",
  removed: "이 포지션에서 뺐습니다. 문서는 그대로 있습니다.",
};

type SearchParams = { position?: string; done?: string; error?: string };

/**
 * 운영 분류 편집 (PRD 3.1-6 "운영자가 배포 없이 분류를 갱신").
 *
 * 패치마다 챔피언이 오르내린다. 원래 미드에 없던 챔피언이 올라오고, 있던 챔피언이
 * 내려간다. 그때마다 배포하는 것은 운영이 아니므로 이 화면에서 고친다.
 *
 * **문서는 여기서 만들어지지도 지워지지도 않는다.** 매치업 문서의 식별자는 챔피언이라
 * (마이그레이션 0003) 배치를 아무리 옮겨도 이미 쓰인 글은 제자리에 있고, 주소로도
 * 계속 열린다. 이 화면이 정하는 것은 "어디서 찾을 수 있는가"뿐이다.
 */
export default async function AdminTaxonomyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePageAdmin();

  const { position: positionParam, done, error } = await searchParams;
  const positionSlug = getPosition(positionParam ?? "") ? positionParam! : DEFAULT_POSITION_SLUG;
  const position = getPosition(positionSlug)!;
  const categories = getCategoriesFor(positionSlug);

  const taxonomy = await getTaxonomy();

  /** 이 포지션에 이미 놓인 챔피언 → 그 카테고리 이름. 고르는 칸에서 표시해 준다. */
  const placedHere = new Map<string, string>();
  for (const category of categories) {
    for (const champion of taxonomy.championsIn(positionSlug, category.slug)) {
      placedHere.set(champion.slug, category.name);
    }
  }

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">관리자</p>
      <h1 className={`display ${styles.title}`}>분류 편집</h1>
      <p className={styles.lead}>
        패치로 바뀐 배치를 여기서 고칩니다. <strong>이미 쓰인 문서는 사라지지 않습니다</strong> —
        배치는 어디서 찾을 수 있는지만 정하고, 상대법 문서는 챔피언에 딸려 있습니다.
      </p>

      {done && <p className={styles.done}>{DONE_LABEL[done] ?? "처리했습니다."}</p>}
      {error && <p className={styles.error}>배치할 수 없는 조합입니다.</p>}

      {/* ------------------------------------------------------- 포지션 탭 */}
      <nav className={styles.tabs} aria-label="포지션 선택">
        {positions.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/taxonomy?position=${p.slug}`}
            className={`sticker ${p.slug === positionSlug ? "sticker--acid" : ""}`}
            aria-current={p.slug === positionSlug ? "page" : undefined}
          >
            {p.name}
          </Link>
        ))}
      </nav>

      {/* --------------------------------------------------- 배치·이동 폼 */}
      {/*
        넣기와 옮기기가 같은 폼이다. 한 포지션에서 한 챔피언은 카테고리 하나에만
        속하므로(마이그레이션 0004의 기본 키), 이미 있는 챔피언을 다른 카테고리로
        고르면 그대로 이동이 된다. 조작을 둘로 나눌 이유가 없다.
      */}
      <form action={placeChampionAction} className={styles.placeForm}>
        <input type="hidden" name="positionSlug" value={positionSlug} />

        <label className={styles.field}>
          <span className={styles.fieldLabel}>챔피언</span>
          <select name="championSlug" className={styles.select} required defaultValue="">
            <option value="" disabled>
              고르세요
            </option>
            {allChampions.map((champion) => {
              const here = placedHere.get(champion.slug);
              return (
                <option key={champion.slug} value={champion.slug}>
                  {champion.name}
                  {here ? ` — 지금 ${here}` : ""}
                </option>
              );
            })}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>{position.name} 카테고리</span>
          <select name="categorySlug" className={styles.select} required defaultValue="">
            <option value="" disabled>
              고르세요
            </option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn btn--acid">
          배치
        </button>
      </form>

      {/* ----------------------------------------------------- 카테고리별 */}
      <div className={styles.categories}>
        {categories.map((category) => {
          const champions = taxonomy.championsIn(positionSlug, category.slug);
          return (
            <section key={category.slug} className={styles.category}>
              <h2 className={styles.categoryTitle}>
                {category.name}
                <span className={`mono ${styles.count}`}>{champions.length}</span>
              </h2>

              {champions.length === 0 ? (
                <p className={styles.empty}>배정된 챔피언이 없습니다.</p>
              ) : (
                <ul className={styles.chips}>
                  {champions.map((champion) => (
                    <li key={champion.slug} className={styles.chip}>
                      <Link href={`/matchup/${champion.slug}`} className={styles.chipName}>
                        {champion.name}
                      </Link>
                      {/*
                        옮기는 것은 위 폼이 맡는다. 여기 있는 것은 "이 포지션에서
                        아예 뺀다"뿐이라, 칩마다 폼을 하나씩 두어도 무겁지 않다.
                      */}
                      <form action={unplaceChampionAction}>
                        <input type="hidden" name="positionSlug" value={positionSlug} />
                        <input type="hidden" name="championSlug" value={champion.slug} />
                        <button
                          type="submit"
                          className={styles.remove}
                          aria-label={`${position.name}에서 ${champion.name} 빼기`}
                        >
                          ×
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
