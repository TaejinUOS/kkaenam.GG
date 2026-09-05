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
  /** 이 챔피언이 지금 서비스에 서 있는가 (FR-39). 문서 열람과는 무관하다. */
  isActive(championSlug: string): boolean;
  /** 내려가 있는 챔피언 슬러그 전부. 관리자 화면이 쓴다. */
  inactiveSlugs(): string[];
  /** 한 포지션 전체의 챔피언. 이름순. */
  championsInPosition(positionSlug: string): Champion[];
  /** 그 포지션에서 이 챔피언이 속한 카테고리. 없으면 undefined. */
  categoryOf(positionSlug: string, championSlug: string): Category | undefined;
  /** 이 챔피언이 놓인 자리 전부. 포지션 순서대로. */
  placementsOf(championSlug: string): Placement[];
  /** 분류 어딘가에 있는 챔피언 슬러그 전부. 중복 없음. */
  classifiedSlugs(): string[];
};

/**
 * @param inactive 내려간 챔피언 (FR-39).
 * @param includeInactive 내려간 챔피언도 목록에 담을지. **관리자 화면만 켠다** —
 *   운영자는 자기가 내린 챔피언을 계속 보고 관리할 수 있어야 한다.
 */
function buildSnapshot(
  rows: PlacementRow[],
  inactive: ReadonlySet<string>,
  includeInactive: boolean,
): TaxonomySnapshot {
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
    slugs
      .filter((s) => includeInactive || !inactive.has(s))
      .map((s) => getChampionBySlug(s))
      .filter((c): c is Champion => Boolean(c));

  return {
    isActive(championSlug) {
      return !inactive.has(championSlug);
    },
    inactiveSlugs() {
      return [...inactive];
    },
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
      if (!includeInactive && inactive.has(championSlug)) return undefined;
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
      return [...classified].filter((slug) => includeInactive || !inactive.has(slug));
    },
  };
}

/**
 * 분류 전체를 읽는다.
 *
 * 캐시하지 않는다. 200행 남짓의 한 번 질의라 값이 싸고, 운영자가 방금 고친 배치가
 * 다음 화면에 바로 보이지 않으면 고친 것인지 아닌지를 알 수 없다.
 *
 * 배정과 운영 상태를 `batch`로 함께 읽는 것은 왕복 때문이 아니라 **둘이 같은 시점의
 * 값이어야** 하기 때문이다. 그 사이에 운영자가 챔피언을 내리면 목록에는 있는데
 * 걸러지지 않은 한 화면이 나온다.
 */
export async function getTaxonomy(
  options: { includeInactive?: boolean } = {},
): Promise<TaxonomySnapshot> {
  const DB = await db();
  const [placements, ops] = await DB.batch<Record<string, unknown>>([
    DB.prepare(
      `SELECT position_slug, category_slug, champion_slug, sort_order
         FROM champion_placements
        ORDER BY position_slug, category_slug, sort_order`,
    ),
    DB.prepare(`SELECT champion_slug FROM champion_ops WHERE active = 0`),
  ]);

  const inactive = new Set(
    (ops.results ?? []).map((row) => row.champion_slug as string),
  );

  return buildSnapshot(
    (placements.results ?? []).map((r) => ({
      positionSlug: r.position_slug as string,
      categorySlug: r.category_slug as string,
      championSlug: r.champion_slug as string,
      sortOrder: r.sort_order as number,
    })),
    inactive,
    options.includeInactive ?? false,
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

/**
 * 카테고리 안에서 챔피언을 한 칸 옮긴다 (FR-38).
 *
 * 그 카테고리의 순서를 통째로 `1..n`으로 다시 매긴 다음 이웃과 자리를 바꾼다.
 * 맞바꾸기만 하지 않는 이유는 초기 이관분에 같은 `sort_order`가 여럿 있을 수 있어서다 —
 * 그때 맞바꾸기는 조용히 아무것도 하지 않는다. 한 카테고리는 스무 명 남짓이라 전부
 * 다시 쓰는 값이 싸고, 몇 번을 눌러도 같은 결과가 나온다.
 */
export async function moveChampion(
  positionSlug: string,
  categorySlug: string,
  championSlug: string,
  direction: "up" | "down",
  actorId: string,
): Promise<PlaceResult> {
  if (!getCategory(positionSlug, categorySlug)) return { ok: false, error: "validation" };

  const DB = await db();
  const rows = await DB.prepare(
    `SELECT champion_slug FROM champion_placements
      WHERE position_slug = ?1 AND category_slug = ?2
      ORDER BY sort_order, champion_slug`,
  )
    .bind(positionSlug, categorySlug)
    .all<{ champion_slug: string }>();

  const order = (rows.results ?? []).map((r) => r.champion_slug);
  const at = order.indexOf(championSlug);
  if (at < 0) return { ok: false, error: "validation" };

  const to = direction === "up" ? at - 1 : at + 1;
  /* 끝에서 한 번 더 누른 것은 오류가 아니다. 아무 일도 일어나지 않으면 된다. */
  if (to < 0 || to >= order.length) return { ok: true };
  [order[at], order[to]] = [order[to], order[at]];

  const now = new Date().toISOString();
  await DB.batch(
    order.map((slug, index) =>
      DB.prepare(
        `UPDATE champion_placements
            SET sort_order = ?1, updated_at = ?2, updated_by = ?3
          WHERE position_slug = ?4 AND champion_slug = ?5`,
      ).bind(index + 1, now, actorId, positionSlug, slug),
    ),
  );

  return { ok: true };
}

// ------------------------------------------------------------- 운영 상태 (FR-39)

/** 내려가 있는 챔피언 한 줄. 관리자 화면이 목록으로 보여 준다. */
export type ChampionOpsRow = {
  championSlug: string;
  note: string | null;
  updatedAt: string;
  updatedByName: string | null;
};

export async function listInactiveChampions(): Promise<ChampionOpsRow[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT o.champion_slug, o.note, o.updated_at, u.name AS updated_by_name
       FROM champion_ops o
       LEFT JOIN users u ON u.id = o.updated_by
      WHERE o.active = 0
      ORDER BY o.updated_at DESC`,
  ).all<{
    champion_slug: string;
    note: string | null;
    updated_at: string;
    updated_by_name: string | null;
  }>();

  return (rows.results ?? []).map((r) => ({
    championSlug: r.champion_slug,
    note: r.note,
    updatedAt: r.updated_at,
    updatedByName: r.updated_by_name,
  }));
}

/**
 * 챔피언을 내리거나 올린다 (FR-39).
 *
 * 내려도 **문서는 그대로다.** 이 값이 정하는 것은 선택 화면·검색·Me 콤보박스·아직 없는
 * 문서 집계에 이 챔피언이 나오는가뿐이고, `/matchup/<슬러그>`는 계속 열린다.
 *
 * 올릴 때 행을 지우지 않고 `active = 1`로 남기는 것은 사유와 시각을 남겨 두기 위해서다.
 * 그 기록이 FR-43(분류 변경 이력)의 절반이 된다.
 */
export async function setChampionActive(
  championSlug: string,
  active: boolean,
  note: string | null,
  actorId: string,
): Promise<PlaceResult> {
  if (!getChampionBySlug(championSlug)) return { ok: false, error: "validation" };

  const DB = await db();
  await DB.prepare(
    `INSERT INTO champion_ops (champion_slug, active, note, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT (champion_slug) DO UPDATE SET
       active     = excluded.active,
       note       = excluded.note,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  )
    .bind(championSlug, active ? 1 : 0, note, new Date().toISOString(), actorId)
    .run();

  return { ok: true };
}
