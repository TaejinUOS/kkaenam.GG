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

  /*
   * 게시된 문서만 센다. 승인 전 제안과 거절된 껍데기는 아직(또는 영영) 문서가 아니고,
   * 그것까지 세면 목록에서 찾을 수 없는 문서가 숫자에만 있게 된다.
   */
  const [docs, edits, written] = await DB.batch<Record<string, unknown>>([
    DB.prepare(`SELECT COUNT(*) AS n FROM wiki_docs WHERE doc_status = 'published'`),
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

/**
 * 게시된 일반 문서의 이름 전부. 첫 화면 검색이 이 목록을 훑는다.
 *
 * 이름만 읽는다. 본문 검색은 5단계의 일이고, 그때까지도 **있는 문서가 검색에서
 * 안 나오는 것은 안 된다** — 그러면 사람이 이미 있는 문서를 다시 제안하게 된다.
 *
 * 문서가 수백을 넘어가면 이 목록을 첫 응답에 싣는 방식 자체를 바꿔야 한다
 * (`selection.ts`와 같은 한계다). 한도는 그 시점을 알아차리기 위한 것이다.
 */
export async function listArticleTitles(limit = 500): Promise<{ title: string; titleKey: string }[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT title, title_key FROM wiki_docs
      WHERE kind = 'article' AND doc_status = 'published'
      ORDER BY title
      LIMIT ?1`,
  )
    .bind(limit)
    .all<{ title: string; title_key: string }>();

  return (rows.results ?? []).map((row) => ({ title: row.title, titleKey: row.title_key }));
}
