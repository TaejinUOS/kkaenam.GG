/**
 * `위키` 첫 화면 · 최근 변경 · 아직 없는 문서가 쓰는 조회 — D1 접근 계층.
 *
 * `wikiStore.ts`는 문서 하나를 읽고, 이 모듈은 **위키 전체를 훑는다.** 목적이 다르고
 * 부르는 화면도 달라 파일을 나눈다. `server-only`를 import해 클라이언트 번들에
 * 섞이면 빌드가 실패하게 하는 것은 같다.
 *
 * 설계는 `docs/WIKI_EXPANSION.md`의 "첫 화면".
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

async function db() {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

export type WikiIndexStats = {
  /** 지금 존재하는 문서 수. 행이 있다는 것은 누군가 한 번은 썼다는 뜻이다. */
  docCount: number;
  /** 최근 7일간 반영된 편집 수. 이 위키가 살아 있는지를 말하는 숫자다. */
  weekEditCount: number;
  /** 이미 문서가 있는 챔피언의 슬러그. 챔피언당 문서 하나다 (마이그레이션 0003). */
  writtenChampionSlugs: string[];
};

/**
 * 첫 화면이 필요한 집계를 한 번에 읽는다.
 *
 * 세 질의를 `batch`로 묶는 이유는 왕복 때문이 아니라 **셋이 같은 시점의 값이어야**
 * 하기 때문이다. 문서 수와 아직 없는 문서 수가 서로 다른 순간을 가리키면 두 숫자를
 * 나란히 놓은 화면이 앞뒤가 맞지 않는다.
 */
export async function getWikiIndexStats(): Promise<WikiIndexStats> {
  const DB = await db();

  /* 7일 경계는 서버 시각으로 자른다. 화면이 "7D"라고만 적으므로 시간대는 문제되지 않는다. */
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [docs, edits, written] = await DB.batch<Record<string, unknown>>([
    DB.prepare(`SELECT COUNT(*) AS n FROM wiki_docs`),
    DB.prepare(
      `SELECT COUNT(*) AS n FROM wiki_edits WHERE status = 'accepted' AND created_at >= ?1`,
    ).bind(since),
    DB.prepare(`SELECT champion_slug FROM wiki_docs WHERE champion_slug IS NOT NULL`),
  ]);

  const first = (result: { results?: Record<string, unknown>[] }) =>
    Number((result.results?.[0]?.n as number | undefined) ?? 0);

  return {
    docCount: first(docs),
    weekEditCount: first(edits),
    writtenChampionSlugs: (written.results ?? []).map((row) => row.champion_slug as string),
  };
}
