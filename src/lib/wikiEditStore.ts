/**
 * 상대법 위키 편집·검토 — D1 쓰기 계층.
 *
 * `wikiStore.ts`/`userStore.ts`와 같은 패턴이다: `server-only`로 클라이언트 번들
 * 유입을 막고, `getCloudflareContext({ async: true })`로 바인딩을 얻고, positional
 * bind를 쓴다. 설계 근거는 `docs/WIKI_MODEL.md`, 스키마는 `migrations/`.
 *
 * 승인·즉시반영·되돌리기는 "섹션 본문 쓰기 + wiki_docs.revision 증가 + wiki_edits
 * 기록"을 `DB.batch()`로 한 번에 묶는다 — 이 파일에서 이 코드베이스 최초로 쓴다.
 *
 * 문서 종류(매치업·일반)는 **문서를 찾는 자리에서만** 갈린다 (`resolveDoc`). 그 아래
 * 편집 판정·검토·역사·되돌리기는 종류를 묻지 않는다 — 전부 `doc_id` 기준이기 때문이다.
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  MAX_BODY_LENGTH,
  MAX_SUMMARY_LENGTH,
  RATE_LIMIT_PER_HOUR,
  isEmptyBody,
  type AcceptedVia,
  type DocRef,
  type DocStatus,
  type DocTarget,
  type EditStatus,
} from "@/data/wiki";
import { isAdditionOnly } from "@/lib/wikiDiff";
import { resolveWikiTitle } from "@/lib/wikiLink";
import { articleHref, checkArticleTitle, titleKey, type TitleProblem } from "@/lib/wikiTitle";

async function db() {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

function newEditId(): string {
  return `edit-${crypto.randomUUID()}`;
}

/**
 * 새 매치업 문서의 id.
 *
 * 통일 이전(마이그레이션 0003)에 만들어진 문서는 `doc-mid-ahri` 꼴을 그대로 갖고
 * 있다. 자식 표가 전부 이 값을 참조하고 있어 옮기지 않았다. 그래서 **이 함수의 값으로
 * 기존 문서를 찾으면 안 된다** — 만들 때만 쓰고, 찾을 때는 champion_slug로 다시 읽는다.
 */
function newDocId(championSlug: string): string {
  return `doc-c-${championSlug}`;
}

/**
 * 새 일반 문서의 id.
 *
 * 이름에서 짓지 않는다. 거절된 제안은 이름만 놓아주고 행은 남으므로(아래
 * `rejectEdit`), 같은 이름이 다시 제안되면 이름에서 지은 id가 부딪힌다. 식별자는
 * 불투명한 값이고 문서를 찾는 것은 `title_key`가 한다.
 */
function newArticleId(): string {
  return `doc-a-${crypto.randomUUID()}`;
}

/* --------------------------------------------------------------- 문서 가리키기 */

/** 문서의 정체를 함께 읽어 오는 열. 목록 질의가 전부 이 조각을 쓴다. */
const DOC_COLUMNS = `d.kind, d.champion_slug, d.title, d.title_key, d.doc_status`;

type DocColumns = {
  kind: string;
  champion_slug: string | null;
  title: string | null;
  title_key: string | null;
  doc_status: string;
};

/**
 * D1의 한 행에서 문서의 정체를 뽑는다.
 *
 * 매치업 문서는 이름을 저장하지 않으므로(챔피언 카탈로그가 갖고 있다) 여기서는
 * 슬러그만 넘기고, 부르는 이름은 화면 쪽 `wikiDocTarget.ts`가 짓는다.
 */
function targetOf(row: DocColumns): DocTarget {
  if (row.kind === "article") {
    return {
      kind: "article",
      title: row.title ?? "",
      titleKey: row.title_key ?? "",
      status: row.doc_status as DocStatus,
    };
  }
  return { kind: "matchup", championSlug: row.champion_slug ?? "" };
}

type ResolvedDoc = { id: string; target: DocTarget; status: DocStatus };

/**
 * 문서 참조로 문서를 찾는다. 없으면 null.
 *
 * 매치업 문서는 챔피언이 카탈로그에 있으면 언제나 열리므로 없으면 만든다 — 첫 편집이
 * 곧 문서 생성이다. 일반 문서는 그럴 수 없다. **이름을 차지하는 일**이라 운영자
 * 승인을 거쳐야 하고, 그 경로는 `proposeArticle` 하나뿐이다.
 */
async function resolveDoc(
  DB: D1Database,
  ref: DocRef,
  options: { createMatchup?: { patch: string; now: string } } = {},
): Promise<ResolvedDoc | null> {
  if (ref.kind === "matchup" && options.createMatchup) {
    // 문서가 없으면 만든다. 이미 있으면 손대지 않는다.
    await DB.prepare(
      `INSERT INTO wiki_docs (id, kind, champion_slug, general, revision, patch, edit_policy, doc_status, created_at, updated_at, updated_by)
         VALUES (?1, 'matchup', ?2, '', 0, ?3, 'guarded', 'published', ?4, ?4, NULL)
       ON CONFLICT (champion_slug) DO NOTHING`,
    )
      .bind(
        newDocId(ref.championSlug),
        ref.championSlug,
        options.createMatchup.patch,
        options.createMatchup.now,
      )
      .run();
  }

  /*
   * id를 계산해 쓰지 않고 다시 읽는다. 통일 이전에 만들어진 문서는 id가 `doc-mid-ahri`
   * 꼴이라, 계산한 `doc-c-ahri`로 찾으면 없는 문서가 되고 새로 만들려다 유일 인덱스에 걸린다.
   */
  const row =
    ref.kind === "matchup"
      ? await DB.prepare(`SELECT d.id, ${DOC_COLUMNS} FROM wiki_docs d WHERE d.champion_slug = ?1`)
          .bind(ref.championSlug)
          .first<DocColumns & { id: string }>()
      : await DB.prepare(
          `SELECT d.id, ${DOC_COLUMNS} FROM wiki_docs d WHERE d.kind = 'article' AND d.title_key = ?1`,
        )
          .bind(ref.titleKey)
          .first<DocColumns & { id: string }>();

  if (!row) return null;
  return { id: row.id, target: targetOf(row), status: row.doc_status as DocStatus };
}

// ---------------------------------------------------------------- 제출 (FR-24~27, 32)

export type SubmitEditInput = {
  /** 고칠 문서. 매치업이든 일반 문서든 아래 판정은 똑같이 돈다. */
  doc: DocRef;
  /** null이면 공통 섹션(일반 문서에서는 본문). */
  meSlug: string | null;
  body: string;
  summary: string;
  authorId: string;
  isAdmin: boolean;
  patch: string;
};

export type SubmitEditResult =
  | { ok: true; status: EditStatus }
  | { ok: false; error: "validation" | "rate_limited" | "not_found" };

/**
 * 편집 제안을 제출한다. 즉시반영/검토대기 판정은 저장 시점에 서버가 실제 값으로
 * 한다 (WIKI_MODEL.md "판정은 서버가 한다") — 편집기를 열 때의 상태를 신뢰하지 않는다.
 *
 * 분기 로직:
 *   accept      = isAdmin || (!isDelete && isAdditionOnly(현재 본문, 낸 본문))
 *   acceptedVia = !accept ? null : isAdmin ? "admin" : wasEmpty ? "empty_section" : "addition_only"
 *
 * **지운 것이 없으면 검토를 건너뛴다.** 편집기의 빨간 형광펜과 같은 판정이며, 같은
 * 함수(`isAdditionOnly`)를 쓴다 — 화면에 초록만 보이는데 대기열로 가는 일이 없어야 한다.
 * 남이 쓴 글은 그대로 두고 덧붙이기만 하는 편집은 잃을 것이 없다는 것이 근거다
 * (WIKI_MODEL.md "편집에는 두 갈래가 있다").
 *
 * 관리자 본인 편집은 삭제라도 즉시 반영된다 (자기 글을 자기가 검토하지 않음).
 * 빈 본문 제출은 섹션 전부를 지우는 것이라 언제나 검토 대기다 (FR-26).
 */
export async function submitEdit(input: SubmitEditInput): Promise<SubmitEditResult> {
  const body = input.body;
  const summary = input.summary.trim();

  if (body.length > MAX_BODY_LENGTH) return { ok: false, error: "validation" };
  if (summary.length > MAX_SUMMARY_LENGTH) return { ok: false, error: "validation" };

  const DB = await db();
  const now = new Date().toISOString();

  // 제출 제한 (FR-32): 계정당 시간당 상한.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await DB.prepare(
    `SELECT COUNT(*) AS n FROM wiki_edits WHERE author = ?1 AND created_at > ?2`,
  )
    .bind(input.authorId, hourAgo)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return { ok: false, error: "rate_limited" };
  }

  const doc = await resolveDoc(DB, input.doc, { createMatchup: { patch: input.patch, now } });
  if (!doc) return { ok: false, error: "not_found" };
  /*
   * 승인 전 문서는 첫 본문 말고는 받지 않는다. 그 본문은 제안과 함께 이미 대기열에
   * 있고(`proposeArticle`), 아직 이름조차 확정되지 않은 문서에 편집이 겹쳐 쌓이면
   * 운영자가 무엇을 승인하는 것인지 알 수 없게 된다.
   */
  if (doc.status !== "published") return { ok: false, error: "not_found" };
  const id = doc.id;

  const editId = newEditId();
  const isDelete = isEmptyBody(body);

  /*
   * revision을 먼저 올려 이 편집이 문서를 쥐고 쓴다.
   *
   * 승인된 편집은 어느 섹션이든 revision을 1 올리므로, `WHERE revision = 읽은 값`이
   * 0건이면 그 사이 누군가 반영했다는 뜻이다. 그때는 **바뀐 본문으로 다시 판정한다** —
   * 뒤늦게 닿은 편집이 앞사람 글을 못 본 채 덮어쓰는 일을 막고, 앞사람이 쓴 글을
   * 지우게 되는 편집이라면 그제야 검토 대기로 보낸다.
   *
   * 세 번까지만 다시 시도한다. 그보다 붐비는 문서라면 사람이 한 번 보는 편이 낫다.
   */
  for (let attempt = 0; attempt < 3; attempt++) {
    // 저장 시점의 실제 값을 다시 읽는다 — 편집기를 연 시점의 상태는 신뢰하지 않는다.
    const state = await DB.prepare(`SELECT id, revision, general FROM wiki_docs WHERE id = ?1`)
      .bind(id)
      .first<{ id: string; revision: number; general: string }>();
    if (!state) return { ok: false, error: "validation" };

    const currentBody = input.meSlug
      ? ((
          await DB.prepare(`SELECT body FROM wiki_sections WHERE doc_id = ?1 AND me_slug = ?2`)
            .bind(id, input.meSlug)
            .first<{ body: string }>()
        )?.body ?? "")
      : state.general;

    const wasEmpty = isEmptyBody(currentBody);
    const accept = input.isAdmin || (!isDelete && isAdditionOnly(currentBody, body));

    if (!accept) {
      await DB.prepare(
        `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7, ?8)`,
      )
        .bind(editId, id, input.meSlug, state.revision, body, summary, input.authorId, now)
        .run();
      return { ok: true, status: "pending" };
    }

    const acceptedVia: AcceptedVia = input.isAdmin
      ? "admin"
      : wasEmpty
        ? "empty_section"
        : "addition_only";
    const newRevision = state.revision + 1;

    const claimed = await DB.prepare(
      `UPDATE wiki_docs SET revision = ?1 WHERE id = ?2 AND revision = ?3`,
    )
      .bind(newRevision, id, state.revision)
      .run();
    if ((claimed.meta.changes ?? 0) === 0) continue;

    /*
     * 문서를 쥐었으니 본문을 쓴다. 여기서부터는 조건 없이 덮어써도 된다 — 같은
     * revision을 쥔 사람은 하나뿐이다.
     */
    const applyStmt = input.meSlug
      ? DB.prepare(
          `INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
             VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT (doc_id, me_slug) DO UPDATE SET
             body = excluded.body, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
        ).bind(id, input.meSlug, body, now, input.authorId)
      : DB.prepare(
          `UPDATE wiki_docs SET general = ?1, updated_at = ?2, updated_by = ?3 WHERE id = ?4`,
        ).bind(body, now, input.authorId, id);

    const recordStmt = DB.prepare(
      `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, revision)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'accepted', ?7, ?8, ?9, ?10)`,
    ).bind(editId, id, input.meSlug, state.revision, body, summary, input.authorId, now, acceptedVia, newRevision);

    await DB.batch([applyStmt, recordStmt]);
    return { ok: true, status: "accepted" };
  }

  // 세 번 다 다른 편집에 밀렸다. 사람이 한 번 보게 한다.
  const latest = await DB.prepare(`SELECT revision FROM wiki_docs WHERE id = ?1`)
    .bind(id)
    .first<{ revision: number }>();
  await DB.prepare(
    `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7, ?8)`,
  )
    .bind(editId, id, input.meSlug, latest?.revision ?? 0, body, summary, input.authorId, now)
    .run();
  return { ok: true, status: "pending" };
}

// ------------------------------------------------------------ 새 문서 제안 (2단계)

export type ProposeArticleInput = {
  title: string;
  body: string;
  summary: string;
  authorId: string;
  isAdmin: boolean;
  patch: string;
};

export type ProposeArticleResult =
  | { ok: true; status: EditStatus; href: string }
  /** 이름이 이미 임자가 있다. 막다른 오류가 아니라 **그 문서로 데려간다**. */
  | { ok: false; error: "taken"; takenBy: "article" | "matchup" | "proposal"; href: string }
  | { ok: false; error: "validation" | "rate_limited"; problem?: TitleProblem };

/**
 * 새 일반 문서를 제안한다 (`docs/WIKI_EXPANSION.md` "새 문서 만들기").
 *
 * **문서 생성은 언제나 운영자 승인을 거친다.** 즉시 반영의 근거는 "더하기만 하는
 * 편집은 잃을 것이 없다"였는데, 문서 생성은 내용이 아니라 **이름을 차지하는 일**이라
 * 그 논리가 닿지 않는다. 나쁜 이름은 목록·검색·분류를 계속 오염시키고, 이름은
 * 유일해서 나중에 제대로 쓰려는 사람의 자리를 막는다.
 *
 * 관리자는 예외다. 자기 제안을 자기가 검토하는 대기열은 뜻이 없고, 이 코드베이스는
 * 이미 관리자 편집을 즉시 반영한다 (`submitEdit`).
 *
 * 겹침은 세 가지를 모두 본다. 하나라도 걸리면 만들지 않고 그 문서의 주소를 함께
 * 돌려준다. 이 판정도 **저장 시점에 서버가** 한다 — 제목 칸의 미리 알림은 편의일 뿐이다.
 */
export async function proposeArticle(input: ProposeArticleInput): Promise<ProposeArticleResult> {
  const title = input.title.trim();
  const body = input.body;
  const summary = input.summary.trim();

  const problem = checkArticleTitle(title);
  if (problem) return { ok: false, error: "validation", problem };
  if (isEmptyBody(body)) return { ok: false, error: "validation" };
  if (body.length > MAX_BODY_LENGTH) return { ok: false, error: "validation" };
  if (summary.length > MAX_SUMMARY_LENGTH) return { ok: false, error: "validation" };

  const DB = await db();
  const now = new Date().toISOString();
  const key = titleKey(title);

  // 매치업 문서와 겹치는가. 카탈로그만으로 판정되므로 D1보다 먼저 본다.
  const matchupHref = resolveWikiTitle(title);
  if (matchupHref) return { ok: false, error: "taken", takenBy: "matchup", href: matchupHref };

  /*
   * 제출 제한 (FR-32)은 편집과 같은 지갑을 쓴다. 문서 생성은 편집보다 무거운 일이라
   * 여기에만 헐거운 상한을 두면 그쪽으로 도배가 흐른다.
   */
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await DB.prepare(
    `SELECT COUNT(*) AS n FROM wiki_edits WHERE author = ?1 AND created_at > ?2`,
  )
    .bind(input.authorId, hourAgo)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= RATE_LIMIT_PER_HOUR) return { ok: false, error: "rate_limited" };

  // 이미 있는 일반 문서, 그리고 **검토 중인 제안**과도 겹치는가.
  const existing = await DB.prepare(
    `SELECT title, doc_status FROM wiki_docs WHERE kind = 'article' AND title_key = ?1`,
  )
    .bind(key)
    .first<{ title: string; doc_status: string }>();
  if (existing) {
    return {
      ok: false,
      error: "taken",
      takenBy: existing.doc_status === "proposed" ? "proposal" : "article",
      href: articleHref(existing.title),
    };
  }

  const docId = newArticleId();
  const editId = newEditId();
  const publish = input.isAdmin;

  /*
   * 문서 행과 첫 본문을 한 번에 쓴다. 문서 행이 먼저 있어야 이름이 잡히고, 첫 본문이
   * 평범한 편집으로 그 문서에 달려야 검토 화면·문서 역사·「내 편집」이 지금 그대로 돈다.
   *
   * 이름이 그 사이 다른 제안에 잡히면 유일 인덱스가 batch 전체를 되돌린다 — 반쯤
   * 만들어진 문서가 남지 않는다.
   */
  const docStmt = DB.prepare(
    `INSERT INTO wiki_docs (id, kind, champion_slug, title, title_key, doc_status, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
       VALUES (?1, 'article', NULL, ?2, ?3, ?4, ?5, ?6, ?7, 'guarded', ?8, ?8, ?9)`,
  ).bind(
    docId,
    title,
    key,
    publish ? "published" : "proposed",
    publish ? body : "",
    publish ? 1 : 0,
    input.patch,
    now,
    publish ? input.authorId : null,
  );

  const editStmt = publish
    ? DB.prepare(
        `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, revision)
           VALUES (?1, ?2, NULL, 0, ?3, ?4, 'accepted', ?5, ?6, 'admin', 1)`,
      ).bind(editId, docId, body, summary, input.authorId, now)
    : DB.prepare(
        `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at)
           VALUES (?1, ?2, NULL, 0, ?3, ?4, 'pending', ?5, ?6)`,
      ).bind(editId, docId, body, summary, input.authorId, now);

  await DB.batch([docStmt, editStmt]);

  return { ok: true, status: publish ? "accepted" : "pending", href: articleHref(title) };
}

// ---------------------------------------------------------------- 내 편집 (FR-33)

export type MyEditRow = {
  id: string;
  target: DocTarget;
  meSlug: string | null;
  summary: string;
  status: EditStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export async function listMyEdits(authorId: string): Promise<MyEditRow[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT e.id, ${DOC_COLUMNS}, e.me_slug, e.summary, e.status,
            e.created_at, e.reviewed_at, e.review_note
       FROM wiki_edits e JOIN wiki_docs d ON d.id = e.doc_id
      WHERE e.author = ?1
      ORDER BY e.created_at DESC`,
  )
    .bind(authorId)
    .all<
      DocColumns & {
        id: string;
        me_slug: string | null;
        summary: string;
        status: EditStatus;
        created_at: string;
        reviewed_at: string | null;
        review_note: string | null;
      }
    >();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    target: targetOf(r),
    meSlug: r.me_slug,
    summary: r.summary,
    status: r.status,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reviewNote: r.review_note,
  }));
}

// ---------------------------------------------------------------- 검토 (FR-27, 28)

export type PendingEditRow = {
  id: string;
  target: DocTarget;
  meSlug: string | null;
  summary: string;
  authorName: string | null;
  createdAt: string;
  baseRevision: number;
  currentRevision: number;
  /**
   * 이 제안이 문서를 만드는 제안인가.
   *
   * 새 문서 검토는 내용보다 **이름을 판단하는 일**이라 성격이 다르다. 대기열에 두
   * 종류가 섞이므로 화면이 구분해 보여 줘야 한다 (`docs/WIKI_EXPANSION.md` "대가").
   */
  isCreation: boolean;
};

export async function getPendingQueue(): Promise<PendingEditRow[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT e.id, ${DOC_COLUMNS}, e.me_slug, e.summary, e.created_at,
            e.base_revision, d.revision AS current_revision, u.name AS author_name
       FROM wiki_edits e
       JOIN wiki_docs d ON d.id = e.doc_id
       LEFT JOIN users u ON u.id = e.author
      WHERE e.status = 'pending'
      ORDER BY e.created_at ASC`,
  ).all<
    DocColumns & {
      id: string;
      me_slug: string | null;
      summary: string;
      created_at: string;
      base_revision: number;
      current_revision: number;
      author_name: string | null;
    }
  >();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    target: targetOf(r),
    meSlug: r.me_slug,
    summary: r.summary,
    authorName: r.author_name,
    createdAt: r.created_at,
    baseRevision: r.base_revision,
    currentRevision: r.current_revision,
    isCreation: r.doc_status === "proposed" && r.me_slug === null,
  }));
}

export type StaleChange = {
  id: string;
  summary: string;
  authorName: string | null;
  revision: number;
  createdAt: string;
};

export type EditReviewDetail = {
  id: string;
  target: DocTarget;
  meSlug: string | null;
  body: string;
  summary: string;
  authorName: string | null;
  createdAt: string;
  baseRevision: number;
  currentRevision: number;
  currentBody: string;
  /** 문서를 만드는 제안. 승인하면 문서가 게시되고, 거절하면 이름이 풀린다. */
  isCreation: boolean;
  /** base_revision 이후 같은 섹션에 반영된 변경들. 뒤처짐을 보여주는 용도 (FR-28). */
  staleChanges: StaleChange[];
};

export async function getEditForReview(editId: string): Promise<EditReviewDetail | null> {
  const DB = await db();
  const row = await DB.prepare(
    `SELECT e.id, d.id AS doc_id, ${DOC_COLUMNS}, e.me_slug, e.body, e.summary,
            e.created_at, e.base_revision, d.revision AS current_revision, d.general,
            u.name AS author_name
       FROM wiki_edits e
       JOIN wiki_docs d ON d.id = e.doc_id
       LEFT JOIN users u ON u.id = e.author
      WHERE e.id = ?1 AND e.status = 'pending'`,
  )
    .bind(editId)
    .first<
      DocColumns & {
        id: string;
        doc_id: string;
        me_slug: string | null;
        body: string;
        summary: string;
        created_at: string;
        base_revision: number;
        current_revision: number;
        general: string;
        author_name: string | null;
      }
    >();
  if (!row) return null;

  const currentBody = row.me_slug
    ? ((
        await DB.prepare(`SELECT body FROM wiki_sections WHERE doc_id = ?1 AND me_slug = ?2`)
          .bind(row.doc_id, row.me_slug)
          .first<{ body: string }>()
      )?.body ?? "")
    : row.general;

  const staleRows = await DB.prepare(
    `SELECT e2.id, e2.summary, e2.revision, e2.created_at, u2.name AS author_name
       FROM wiki_edits e2
       LEFT JOIN users u2 ON u2.id = e2.author
      WHERE e2.doc_id = ?1 AND e2.me_slug IS ?2 AND e2.status = 'accepted' AND e2.revision > ?3
      ORDER BY e2.revision ASC`,
  )
    .bind(row.doc_id, row.me_slug, row.base_revision)
    .all<{ id: string; summary: string; revision: number; created_at: string; author_name: string | null }>();

  return {
    id: row.id,
    target: targetOf(row),
    meSlug: row.me_slug,
    body: row.body,
    summary: row.summary,
    authorName: row.author_name,
    createdAt: row.created_at,
    baseRevision: row.base_revision,
    currentRevision: row.current_revision,
    currentBody,
    isCreation: row.doc_status === "proposed" && row.me_slug === null,
    staleChanges: (staleRows.results ?? []).map((r) => ({
      id: r.id,
      summary: r.summary,
      authorName: r.author_name,
      revision: r.revision,
      createdAt: r.created_at,
    })),
  };
}

export type ReviewActionResult = { ok: true } | { ok: false; error: "not_found" | "validation" };

/**
 * 승인. 관리자가 저장 전에 본문을 고칠 수 있다 — 그 경우 반영되는 것은 고친 버전이다.
 *
 * 승인 대상이 문서를 만드는 제안이면 문서가 함께 게시된다. 같은 batch에 넣는 이유는
 * 본문만 반영되고 문서가 승인 전에 머무는 상태를 만들지 않기 위해서다 — 그 상태의
 * 문서는 아무 목록에도 나오지 않아 아무도 발견하지 못한다.
 */
export async function approveEdit(
  editId: string,
  input: { reviewerId: string; body?: string; reviewNote: string | null },
): Promise<ReviewActionResult> {
  const DB = await db();
  const now = new Date().toISOString();

  const edit = await DB.prepare(
    `SELECT e.id, e.doc_id, e.me_slug, e.body, e.author, d.revision, d.doc_status
       FROM wiki_edits e JOIN wiki_docs d ON d.id = e.doc_id
      WHERE e.id = ?1 AND e.status = 'pending'`,
  )
    .bind(editId)
    .first<{
      id: string;
      doc_id: string;
      me_slug: string | null;
      body: string;
      author: string;
      revision: number;
      doc_status: string;
    }>();
  if (!edit) return { ok: false, error: "not_found" };

  const finalBody = input.body ?? edit.body;
  if (finalBody.length > MAX_BODY_LENGTH) return { ok: false, error: "validation" };

  const newRevision = edit.revision + 1;

  const applyStmt = edit.me_slug
    ? DB.prepare(
        `INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
           VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (doc_id, me_slug) DO UPDATE SET
           body = excluded.body, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      ).bind(edit.doc_id, edit.me_slug, finalBody, now, edit.author)
    : DB.prepare(`UPDATE wiki_docs SET general = ?1, updated_at = ?2, updated_by = ?3 WHERE id = ?4`).bind(
        finalBody,
        now,
        edit.author,
        edit.doc_id,
      );

  const bumpStmt = DB.prepare(`UPDATE wiki_docs SET revision = ?1 WHERE id = ?2 AND revision = ?3`).bind(
    newRevision,
    edit.doc_id,
    edit.revision,
  );

  const recordStmt = DB.prepare(
    `UPDATE wiki_edits
        SET status = 'accepted', body = ?1, accepted_via = 'review',
            reviewed_at = ?2, reviewer = ?3, review_note = ?4, revision = ?5
      WHERE id = ?6`,
  ).bind(finalBody, now, input.reviewerId, input.reviewNote, newRevision, editId);

  /* 문서를 만드는 제안이면 여기서 게시된다. 이름은 제안 시점에 이미 잡혀 있다. */
  const statements = [applyStmt, bumpStmt, recordStmt];
  if (edit.doc_status === "proposed") {
    statements.push(
      DB.prepare(`UPDATE wiki_docs SET doc_status = 'published' WHERE id = ?1`).bind(edit.doc_id),
    );
  }

  const [, bumpResult] = await DB.batch(statements);
  if ((bumpResult.meta.changes ?? 0) === 0) {
    // 문서가 그 사이 다른 승인으로 또 바뀐 경우. 아주 드물지만 승인 자체를 실패로 알린다 —
    // 검토자가 최신 상태를 다시 보고 승인해야 한다.
    return { ok: false, error: "validation" };
  }
  return { ok: true };
}

/**
 * 거절.
 *
 * 문서를 만드는 제안을 거절하면 **이름을 풀어 줘야** 다음 사람이 그 이름을 쓸 수 있다.
 * 그렇다고 문서 행을 지우지는 않는다 — `wiki_edits`가 `ON DELETE CASCADE`로 매달려
 * 있어 행을 지우면 그 제안 자체가 사라지고, 제안자는 「내 편집」에서 거절 사유를 볼 수
 * 없게 된다 (FR-33). 그래서 `title_key`만 비우고 상태를 `rejected`로 둔다. 이름이
 * 풀린 껍데기는 어느 목록에도 나오지 않는다.
 */
export async function rejectEdit(
  editId: string,
  input: { reviewerId: string; reviewNote: string },
): Promise<ReviewActionResult> {
  if (!input.reviewNote.trim()) return { ok: false, error: "validation" };

  const DB = await db();
  const now = new Date().toISOString();

  const edit = await DB.prepare(
    `SELECT e.doc_id, e.me_slug, d.doc_status
       FROM wiki_edits e JOIN wiki_docs d ON d.id = e.doc_id
      WHERE e.id = ?1 AND e.status = 'pending'`,
  )
    .bind(editId)
    .first<{ doc_id: string; me_slug: string | null; doc_status: string }>();
  if (!edit) return { ok: false, error: "not_found" };

  const rejectStmt = DB.prepare(
    `UPDATE wiki_edits SET status = 'rejected', reviewed_at = ?1, reviewer = ?2, review_note = ?3
      WHERE id = ?4 AND status = 'pending'`,
  ).bind(now, input.reviewerId, input.reviewNote.trim(), editId);

  if (edit.doc_status !== "proposed") {
    const result = await rejectStmt.run();
    if ((result.meta.changes ?? 0) === 0) return { ok: false, error: "not_found" };
    return { ok: true };
  }

  const [result] = await DB.batch([
    rejectStmt,
    DB.prepare(
      `UPDATE wiki_docs SET doc_status = 'rejected', title_key = NULL WHERE id = ?1`,
    ).bind(edit.doc_id),
  ]);
  if ((result.meta.changes ?? 0) === 0) return { ok: false, error: "not_found" };
  return { ok: true };
}

// ---------------------------------------------------------------- 문서 역사 (FR-29)

export type HistoryRow = {
  id: string;
  meSlug: string | null;
  summary: string;
  authorName: string | null;
  revision: number;
  acceptedVia: AcceptedVia;
  createdAt: string;
  reviewedAt: string | null;
};

export async function listDocHistory(ref: DocRef): Promise<HistoryRow[]> {
  const DB = await db();
  const doc = await resolveDoc(DB, ref);
  if (!doc) return [];

  const rows = await DB.prepare(
    `SELECT e.id, e.me_slug, e.summary, u.name AS author_name, e.revision, e.accepted_via,
            e.created_at, e.reviewed_at
       FROM wiki_edits e
       LEFT JOIN users u ON u.id = e.author
      WHERE e.doc_id = ?1 AND e.status = 'accepted'
      ORDER BY e.revision DESC`,
  )
    .bind(doc.id)
    .all<{
      id: string;
      me_slug: string | null;
      summary: string;
      author_name: string | null;
      revision: number;
      accepted_via: AcceptedVia;
      created_at: string;
      reviewed_at: string | null;
    }>();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    meSlug: r.me_slug,
    summary: r.summary,
    authorName: r.author_name,
    revision: r.revision,
    acceptedVia: r.accepted_via,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
  }));
}

export async function getHistoryEntryBody(editId: string): Promise<string | null> {
  const DB = await db();
  const row = await DB.prepare(`SELECT body FROM wiki_edits WHERE id = ?1`).bind(editId).first<{ body: string }>();
  return row?.body ?? null;
}

// ---------------------------------------------------------------- 되돌리기 (FR-30)

export type RevertResult = { ok: true; changedSections: number } | { ok: false; error: "not_found" };

/**
 * 문서를 리비전 N 직후 상태로 되돌린다.
 *
 * `wiki_edits.revision`은 문서 전체 스냅샷 번호가 아니라 섹션 하나가 바뀔 때마다
 * 1씩 오르는 카운터라서, "리비전 N의 문서 상태"는 섹션별로 따로 되짚어야 한다.
 * 공통 섹션과, 한 번이라도 내용이 있었던 모든 me 섹션 각각에 대해
 * `MAX(revision) <= N`인 승인된 편집의 본문을 찾고, 현재 값과 다른 섹션만 복원한다.
 * 되돌리기 한 번이 여러 개의 새 리비전 번호를 만들 수 있다 — 의도된 동작이다.
 */
export async function revertDoc(
  ref: DocRef,
  targetRevision: number,
  adminId: string,
): Promise<RevertResult> {
  const DB = await db();
  const now = new Date().toISOString();

  const resolved = await resolveDoc(DB, ref);
  if (!resolved) return { ok: false, error: "not_found" };

  const doc = await DB.prepare(`SELECT id, revision, general FROM wiki_docs WHERE id = ?1`)
    .bind(resolved.id)
    .first<{ id: string; revision: number; general: string }>();
  if (!doc) return { ok: false, error: "not_found" };

  const meSlugs = await DB.prepare(
    `SELECT DISTINCT me_slug FROM wiki_edits WHERE doc_id = ?1 AND me_slug IS NOT NULL AND status = 'accepted'`,
  )
    .bind(doc.id)
    .all<{ me_slug: string }>();

  const sections: { meSlug: string | null; currentBody: string }[] = [{ meSlug: null, currentBody: doc.general }];
  for (const { me_slug } of meSlugs.results ?? []) {
    const section = await DB.prepare(`SELECT body FROM wiki_sections WHERE doc_id = ?1 AND me_slug = ?2`)
      .bind(doc.id, me_slug)
      .first<{ body: string }>();
    sections.push({ meSlug: me_slug, currentBody: section?.body ?? "" });
  }

  const statements: ReturnType<typeof DB.prepare>[] = [];
  let revision = doc.revision;
  const summary = `r${targetRevision}으로 되돌림`;

  for (const section of sections) {
    const reconstructed = await DB.prepare(
      `SELECT body FROM wiki_edits
        WHERE doc_id = ?1 AND me_slug IS ?2 AND status = 'accepted' AND revision <= ?3
        ORDER BY revision DESC LIMIT 1`,
    )
      .bind(doc.id, section.meSlug, targetRevision)
      .first<{ body: string }>();
    const targetBody = reconstructed?.body ?? "";

    if (targetBody === section.currentBody) continue;

    revision += 1;
    statements.push(
      section.meSlug
        ? DB.prepare(
            `INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
               VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT (doc_id, me_slug) DO UPDATE SET
               body = excluded.body, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
          ).bind(doc.id, section.meSlug, targetBody, now, adminId)
        : DB.prepare(`UPDATE wiki_docs SET general = ?1, updated_at = ?2, updated_by = ?3 WHERE id = ?4`).bind(
            targetBody,
            now,
            adminId,
            doc.id,
          ),
    );
    statements.push(
      DB.prepare(
        `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, revision)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'accepted', ?7, ?8, 'admin', ?9)`,
      ).bind(newEditId(), doc.id, section.meSlug, doc.revision, targetBody, summary, adminId, now, revision),
    );
  }

  if (statements.length === 0) return { ok: true, changedSections: 0 };

  statements.push(DB.prepare(`UPDATE wiki_docs SET revision = ?1 WHERE id = ?2`).bind(revision, doc.id));
  await DB.batch(statements);

  return { ok: true, changedSections: (statements.length - 1) / 2 };
}

// ---------------------------------------------------------------- 최근 변경 (FR-31)

export type RecentChangeRow = {
  id: string;
  target: DocTarget;
  meSlug: string | null;
  summary: string;
  authorName: string | null;
  acceptedVia: AcceptedVia;
  revision: number;
  createdAt: string;
};

/**
 * 반영된 편집을 시간순으로. 매치업 문서와 일반 문서가 한 목록에 섞인다.
 *
 * 게시된 문서만 담는다. 승인 전 문서의 편집은 아직 반영된 것이 아니고, 거절되어
 * 이름을 놓아준 껍데기는 갈 곳이 없다.
 */
export async function listRecentChanges(limit = 50): Promise<RecentChangeRow[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT e.id, ${DOC_COLUMNS}, e.me_slug, e.summary, u.name AS author_name,
            e.accepted_via, e.revision, e.created_at
       FROM wiki_edits e
       JOIN wiki_docs d ON d.id = e.doc_id
       LEFT JOIN users u ON u.id = e.author
      WHERE e.status = 'accepted' AND d.doc_status = 'published'
      ORDER BY e.created_at DESC
      LIMIT ?1`,
  )
    .bind(limit)
    .all<
      DocColumns & {
        id: string;
        me_slug: string | null;
        summary: string;
        author_name: string | null;
        accepted_via: AcceptedVia;
        revision: number;
        created_at: string;
      }
    >();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    target: targetOf(r),
    meSlug: r.me_slug,
    summary: r.summary,
    authorName: r.author_name,
    acceptedVia: r.accepted_via,
    revision: r.revision,
    createdAt: r.created_at,
  }));
}

// ------------------------------------------------------------- 내 기여 요약

export type MyContribution = {
  /** 반영된 편집 수. 이 사람이 실제로 문서를 바꾼 횟수다. */
  accepted: number;
  /** 검토 대기 중. */
  pending: number;
  /** 거절됨. */
  rejected: number;
  /** 반영된 편집이 닿은 문서 수. 몇 개 문서에 기여했는지. */
  docs: number;
};

/**
 * 내 기여 요약 (마이페이지).
 *
 * 위키에서 마이페이지의 본체는 프로필이 아니라 **기여 기록**이다. 얼마나 썼는지,
 * 지금 무엇이 검토를 기다리는지가 다시 들어올 이유가 된다.
 *
 * 네 값을 한 번에 세는 이유는 화면이 넷을 나란히 보여 주기 때문이다. 따로 세면
 * 그 사이 편집이 승인되어 "대기 1, 반영 0" 같은 앞뒤가 안 맞는 줄이 나올 수 있다.
 */
export async function getMyContribution(authorId: string): Promise<MyContribution> {
  const DB = await db();
  const row = await DB.prepare(
    `SELECT
       SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
       SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
       COUNT(DISTINCT CASE WHEN status = 'accepted' THEN doc_id END) AS docs
     FROM wiki_edits WHERE author = ?1`,
  )
    .bind(authorId)
    .first<{
      accepted: number | null;
      pending: number | null;
      rejected: number | null;
      docs: number | null;
    }>();

  return {
    accepted: row?.accepted ?? 0,
    pending: row?.pending ?? 0,
    rejected: row?.rejected ?? 0,
    docs: row?.docs ?? 0,
  };
}
