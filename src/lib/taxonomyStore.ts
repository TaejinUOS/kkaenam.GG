/**
 * 운영 분류 — 어느 챔피언이 어느 포지션의 어느 카테고리에 속하는가.
 *
 * 이 값은 **패치마다 바뀐다.** 원래 미드에 없던 챔피언이 올라오고, 있던 챔피언이
 * 내려간다. 그때마다 배포를 하는 것은 운영이 아니므로 코드가 아니라 D1에 둔다
 * (PRD 3.1-6, 마이그레이션 0004). 포지션과 카테고리 자체는 커버 이미지와 문구를
 * 달고 있는 닫힌 집합이라 `src/data/taxonomy.ts`에 그대로 남는다.
 *
 * **문서는 이 표에 딸리지 않는다.** 매치업 문서의 식별자는 챔피언이므로
 * (마이그레이션 0003) 배치를 아무리 고쳐도 이미 쓰인 글은 제자리에 있다.
 * 배치는 "어디서 찾을 수 있는가"만 정한다.
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getChampionBySlug } from "@/data/champions";
import { getCategoriesFor, getCategory, positions } from "@/data/taxonomy";
import type { Category, Champion, Position } from "@/data/types";

async function db() {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

/** 챔피언이 놓인 자리 하나. */
export type Placement = { position: Position; category: Category };

export type PlacementRow = {
  positionSlug: string;
  categorySlug: string;
  championSlug: string;
  sortOrder: number;
};

/**
 * 한 시점의 분류 전체를 담은 읽기 전용 스냅숏.
 *
 * 조회마다 D1을 왕복하지 않도록 **한 번 읽어 맵으로 세워 두고** 화면에 넘긴다.
 * 그래야 화면 코드가 동기로 남고, 한 화면 안에서 분류가 흔들리지 않는다 —
 * 목록을 그리는 중간에 운영자가 배치를 고쳐도 그 화면은 한 시점을 보여 준다.
 */
export type TaxonomySnapshot = {
  /** 포지션·카테고리에 속한 챔피언. `sort_order` 순. */
  championsIn(positionSlug: string, categorySlug: string): Champion[];
  /** 한 포지션 전체의 챔피언. 이름순. */
  championsInPosition(positionSlug: string): Champion[];
  /** 그 포지션에서 이 챔피언이 속한 카테고리. 없으면 undefined. */
  categoryOf(positionSlug: string, championSlug: string): Category | undefined;
  /** 이 챔피언이 놓인 자리 전부. 포지션 순서대로. */
  placementsOf(championSlug: string): Placement[];
  /** 분류 어딘가에 있는 챔피언 슬러그 전부. 중복 없음. */
  classifiedSlugs(): string[];
};

function buildSnapshot(rows: PlacementRow[]): TaxonomySnapshot {
  /** `${포지션}/${카테고리}` → 슬러그 목록 (sort_order 순) */
  const byCategory = new Map<string, string[]>();
  /** `${포지션}/${챔피언}` → 카테고리 슬러그 */
  const categoryByPair = new Map<string, string>();
  const classified = new Set<string>();

  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const row of sorted) {
    const key = `${row.positionSlug}/${row.categorySlug}`;
    byCategory.set(key, [...(byCategory.get(key) ?? []), row.championSlug]);
    categoryByPair.set(`${row.positionSlug}/${row.championSlug}`, row.categorySlug);
    classified.add(row.championSlug);
  }

  /*
   * 카탈로그에 없는 슬러그는 조용히 버린다. Data Dragon 패치로 챔피언 이름이나
   * 식별자가 바뀌면 배치 행만 남을 수 있는데, 그때 화면이 깨지는 것보다 그 챔피언이
   * 목록에서 빠지는 편이 낫다. 운영자는 `/admin/taxonomy`에서 그 자리를 다시 채운다.
   */
  const toChampions = (slugs: string[]): Champion[] =>
    slugs.map((s) => getChampionBySlug(s)).filter((c): c is Champion => Boolean(c));

  return {
    championsIn(positionSlug, categorySlug) {
      return toChampions(byCategory.get(`${positionSlug}/${categorySlug}`) ?? []);
    },
    championsInPosition(positionSlug) {
      const seen = new Set<string>();
      for (const category of getCategoriesFor(positionSlug)) {
        for (const slug of byCategory.get(`${positionSlug}/${category.slug}`) ?? []) {
          seen.add(slug);
        }
      }
      return toChampions([...seen]).sort((a, b) => a.name.localeCompare(b.name, "ko"));
    },
    categoryOf(positionSlug, championSlug) {
      const categorySlug = categoryByPair.get(`${positionSlug}/${championSlug}`);
      return categorySlug ? getCategory(positionSlug, categorySlug) : undefined;
    },
    placementsOf(championSlug) {
      const result: Placement[] = [];
      for (const position of positions) {
        const category = this.categoryOf(position.slug, championSlug);
        if (category) result.push({ position, category });
      }
      return result;
    },
    classifiedSlugs() {
      return [...classified];
    },
  };
}

/**
 * 분류 전체를 읽는다.
 *
 * 캐시하지 않는다. 200행 남짓의 한 번 질의라 값이 싸고, 운영자가 방금 고친 배치가
 * 다음 화면에 바로 보이지 않으면 고친 것인지 아닌지를 알 수 없다.
 */
export async function getTaxonomy(): Promise<TaxonomySnapshot> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT position_slug, category_slug, champion_slug, sort_order
       FROM champion_placements
      ORDER BY position_slug, category_slug, sort_order`,
  ).all<{
    position_slug: string;
    category_slug: string;
    champion_slug: string;
    sort_order: number;
  }>();

  return buildSnapshot(
    (rows.results ?? []).map((r) => ({
      positionSlug: r.position_slug,
      categorySlug: r.category_slug,
      championSlug: r.champion_slug,
      sortOrder: r.sort_order,
    })),
  );
}

// ------------------------------------------------------------------- 쓰기

export type PlaceResult = { ok: true } | { ok: false; error: "validation" };

/**
 * 챔피언을 한 포지션의 한 카테고리에 놓는다. 이미 그 포지션에 있으면 옮긴다.
 *
 * 순서는 그 카테고리의 맨 뒤로 간다. 운영자가 방금 넣은 챔피언이 목록 중간에
 * 끼어 있으면 들어갔는지 확인하기 어렵다.
 */
export async function placeChampion(
  positionSlug: string,
  categorySlug: string,
  championSlug: string,
  actorId: string,
): Promise<PlaceResult> {
  if (!positions.some((p) => p.slug === positionSlug)) return { ok: false, error: "validation" };
  if (!getCategory(positionSlug, categorySlug)) return { ok: false, error: "validation" };
  if (!getChampionBySlug(championSlug)) return { ok: false, error: "validation" };

  const DB = await db();
  const last = await DB.prepare(
    `SELECT COALESCE(MAX(sort_order), 0) AS n FROM champion_placements
      WHERE position_slug = ?1 AND category_slug = ?2`,
  )
    .bind(positionSlug, categorySlug)
    .first<{ n: number }>();

  await DB.prepare(
    `INSERT INTO champion_placements
       (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT (position_slug, champion_slug) DO UPDATE SET
       category_slug = excluded.category_slug,
       sort_order    = excluded.sort_order,
       updated_at    = excluded.updated_at,
       updated_by    = excluded.updated_by`,
  )
    .bind(
      positionSlug,
      categorySlug,
      championSlug,
      (last?.n ?? 0) + 1,
      new Date().toISOString(),
      actorId,
    )
    .run();

  return { ok: true };
}

/**
 * 한 포지션에서 챔피언을 뺀다.
 *
 * **문서는 지워지지 않는다.** 그 챔피언의 상대법 문서는 그대로 있고 주소로도 열리며,
 * 목록과 검색에서만 빠진다. 다시 넣으면 쓰던 글이 그대로 돌아온다.
 */
export async function unplaceChampion(
  positionSlug: string,
  championSlug: string,
): Promise<PlaceResult> {
  const DB = await db();
  await DB.prepare(
    `DELETE FROM champion_placements WHERE position_slug = ?1 AND champion_slug = ?2`,
  )
    .bind(positionSlug, championSlug)
    .run();
  return { ok: true };
}
