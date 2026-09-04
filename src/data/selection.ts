/**
 * 선택 화면이 사용하는 직렬화 가능한 데이터 뷰.
 *
 * 포지션과 카테고리를 바꿀 때마다 서버를 다시 왕복하면 블루프린트 7장이 규정한 220ms
 * 전환을 지킬 수 없다. 분류 전체가 23KB 남짓이라 첫 응답에 실어 보내고 전환은 클라이언트에서 처리한다.
 */

import type { TaxonomySnapshot } from "@/lib/taxonomyStore";

import { getCategoriesFor, positions } from "./champions";

export type ChampionChip = {
  slug: string;
  name: string;
  iconUrl: string;
};

export type CategoryView = {
  slug: string;
  name: string;
  coverImage: string;
  coverAlt: string;
  role: string;
  championCount: number;
};

export type PositionView = {
  slug: string;
  name: string;
  code: string;
};

export type SelectionData = {
  positions: PositionView[];
  /** 포지션 슬러그 → 카테고리 목록 */
  categories: Record<string, CategoryView[]>;
  /** `${포지션}/${카테고리}` → 챔피언 목록 */
  champions: Record<string, ChampionChip[]>;
};

export function buildSelectionData(taxonomy: TaxonomySnapshot): SelectionData {
  const categories: Record<string, CategoryView[]> = {};
  const champions: Record<string, ChampionChip[]> = {};

  for (const position of positions) {
    const list = getCategoriesFor(position.slug);
    categories[position.slug] = list.map((category) => {
      const roster = taxonomy.championsIn(position.slug, category.slug);
      champions[`${position.slug}/${category.slug}`] = roster.map((c) => ({
        slug: c.slug,
        name: c.name,
        iconUrl: c.iconUrl,
      }));
      return {
        slug: category.slug,
        name: category.name,
        coverImage: category.coverImage,
        coverAlt: category.coverAlt,
        role: category.role,
        championCount: roster.length,
      };
    });
  }

  return {
    positions: positions.map((p) => ({ slug: p.slug, name: p.name, code: p.code })),
    categories,
    champions,
  };
}
