/**
 * 상대법 위키 편집·검토 — D1 쓰기 계층.
 *
 * `wikiStore.ts`/`userStore.ts`와 같은 패턴이다: `server-only`로 클라이언트 번들
 * 유입을 막고, `getCloudflareContext({ async: true })`로 바인딩을 얻고, positional
 * bind를 쓴다. 설계 근거는 `docs/WIKI_MODEL.md`, 스키마는 `migrations/`.
 *
 * 승인·즉시반영·되돌리기는 "섹션 본문 쓰기 + wiki_docs.revision 증가 + wiki_edits
 * 기록"을 `DB.batch()`로 한 번에 묶는다 — 이 파일에서 이 코드베이스 최초로 쓴다.
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  MAX_BODY_LENGTH,
  MAX_SUMMARY_LENGTH,
  RATE_LIMIT_PER_HOUR,
  isEmptyBody,
  type AcceptedVia,
  type EditStatus,
} from "@/data/wiki";

async function db() {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

function newEditId(): string {
  return `edit-${crypto.randomUUID()}`;
}

function docId(positionSlug: string, championSlug: string): string {
  return `doc-${positionSlug}-${championSlug}`;
}

// ---------------------------------------------------------------- 제출 (FR-24~27, 32)

export type SubmitEditInput = {
  positionSlug: string;
  championSlug: string;
  /** null이면 공통 섹션. */
  meSlug: string | null;
  body: string;
  summary: string;
  authorId: string;
  isAdmin: boolean;
  patch: string;
};

export type SubmitEditResult =
  | { ok: true; status: EditStatus }
  | { ok: false; error: "validation" | "rate_limited" };

/**
 * 편집 제안을 제출한다. 즉시반영/검토대기 판정은 저장 시점에 서버가 실제 값으로
 * 한다 (WIKI_MODEL.md "판정은 서버가 한다") — 편집기를 열 때의 상태를 신뢰하지 않는다.
 *
 * 분기 로직 (docs/HANDOFF.md 계획과 동일):
 *   accept      = isAdmin || (!isDelete && wasEmpty)
 *   acceptedVia = !accept ? null : isAdmin ? "admin" : "empty_section"
 *
 * 관리자 본인 편집은 삭제라도 즉시 반영된다 (자기 글을 자기가 검토하지 않음).
 * 일반 사용자의 삭제(빈 본문 제출)는 원래 상태와 무관하게 항상 검토 대기다 (FR-26).
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

  const id = docId(input.positionSlug, input.championSlug);

  // 문서가 없으면 만든다. 이미 있으면 손대지 않는다.
  await DB.prepare(
    `INSERT INTO wiki_docs (id, position_slug, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
       VALUES (?1, ?2, ?3, '', 0, ?4, 'guarded', ?5, ?5, NULL)
     ON CONFLICT (position_slug, champion_slug) DO NOTHING`,
  )
    .bind(id, input.positionSlug, input.championSlug, input.patch, now)
    .run();

  // 저장 시점의 실제 값을 다시 읽는다 — 편집기를 연 시점의 상태는 신뢰하지 않는다.
  const doc = await DB.prepare(`SELECT id, revision, general FROM wiki_docs WHERE id = ?1`)
    .bind(id)
    .first<{ id: string; revision: number; general: string }>();
  if (!doc) return { ok: false, error: "validation" };

  const currentBody = input.meSlug
    ? ((
        await DB.prepare(`SELECT body FROM wiki_sections WHERE doc_id = ?1 AND me_slug = ?2`)
          .bind(id, input.meSlug)
          .first<{ body: string }>()
      )?.body ?? "")
    : doc.general;

  const isDelete = isEmptyBody(body);
  const wasEmpty = isEmptyBody(currentBody);
  const accept = input.isAdmin || (!isDelete && wasEmpty);
  const acceptedVia: AcceptedVia | null = !accept ? null : input.isAdmin ? "admin" : "empty_section";

  const editId = newEditId();

  if (!accept) {
    await DB.prepare(
      `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7, ?8)`,
    )
      .bind(editId, id, input.meSlug, doc.revision, body, summary, input.authorId, now)
      .run();
    return { ok: true, status: "pending" };
  }

  const newRevision = doc.revision + 1;
  const applyStmt = input.meSlug
    ? DB.prepare(
        `INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
           VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (doc_id, me_slug) DO UPDATE SET
           body = excluded.body, updated_at = excluded.updated_at, updated_by = excluded.updated_by
         WHERE ?6 = 1 OR TRIM(wiki_sections.body) = ''`,
      ).bind(id, input.meSlug, body, now, input.authorId, input.isAdmin ? 1 : 0)
    : DB.prepare(
        `UPDATE wiki_docs SET general = ?1, updated_at = ?2, updated_by = ?3
          WHERE id = ?4 AND (?5 = 1 OR TRIM(general) = '')`,
      ).bind(body, now, input.authorId, id, input.isAdmin ? 1 : 0);

  const bumpStmt = DB.prepare(
    `UPDATE wiki_docs SET revision = ?1 WHERE id = ?2 AND revision = ?3`,
  ).bind(newRevision, id, doc.revision);

  const recordStmt = DB.prepare(
    `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, revision)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'accepted', ?7, ?8, ?9, ?10)`,
  ).bind(editId, id, input.meSlug, doc.revision, body, summary, input.authorId, now, acceptedVia, newRevision);

  const [applyResult, bumpResult] = await DB.batch([applyStmt, bumpStmt, recordStmt]);

  // 두 사람이 같은 빈 섹션에 동시에 제출하면 먼저 닿은 쪽만 적용된다. 늦은 쪽은
  // 여기서 0건으로 확인되므로, 이미 만든 wiki_edits 행을 검토 대기로 되돌린다
  // (WIKI_MODEL.md "나중 쪽은 검토 대기로 간다").
  if ((applyResult.meta.changes ?? 0) === 0 || (bumpResult.meta.changes ?? 0) === 0) {
    await DB.prepare(
      `UPDATE wiki_edits SET status = 'pending', accepted_via = NULL, revision = NULL WHERE id = ?1`,
    )
      .bind(editId)
      .run();
    return { ok: true, status: "pending" };
  }

  return { ok: true, status: "accepted" };
}

// ---------------------------------------------------------------- 내 편집 (FR-33)

export type MyEditRow = {
  id: string;
  positionSlug: string;
  championSlug: string;
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
    `SELECT e.id, d.position_slug, d.champion_slug, e.me_slug, e.summary, e.status,
            e.created_at, e.reviewed_at, e.review_note
       FROM wiki_edits e JOIN wiki_docs d ON d.id = e.doc_id
      WHERE e.author = ?1
      ORDER BY e.created_at DESC`,
  )
    .bind(authorId)
    .all<{
      id: string;
      position_slug: string;
      champion_slug: string;
      me_slug: string | null;
      summary: string;
      status: EditStatus;
      created_at: string;
      reviewed_at: string | null;
      review_note: string | null;
    }>();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    positionSlug: r.position_slug,
    championSlug: r.champion_slug,
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
  positionSlug: string;
  championSlug: string;
  meSlug: string | null;
  summary: string;
  authorName: string | null;
  createdAt: string;
  baseRevision: number;
  currentRevision: number;
};

export async function getPendingQueue(): Promise<PendingEditRow[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT e.id, d.position_slug, d.champion_slug, e.me_slug, e.summary, e.created_at,
            e.base_revision, d.revision AS current_revision, u.name AS author_name
       FROM wiki_edits e
       JOIN wiki_docs d ON d.id = e.doc_id
       LEFT JOIN users u ON u.id = e.author
      WHERE e.status = 'pending'
      ORDER BY e.created_at ASC`,
  ).all<{
    id: string;
    position_slug: string;
    champion_slug: string;
    me_slug: string | null;
    summary: string;
    created_at: string;
    base_revision: number;
    current_revision: number;
    author_name: string | null;
  }>();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    positionSlug: r.position_slug,
    championSlug: r.champion_slug,
    meSlug: r.me_slug,
    summary: r.summary,
    authorName: r.author_name,
    createdAt: r.created_at,
    baseRevision: r.base_revision,
    currentRevision: r.current_revision,
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
  positionSlug: string;
  championSlug: string;
  meSlug: string | null;
  body: string;
  summary: string;
  authorName: string | null;
  createdAt: string;
  baseRevision: number;
  currentRevision: number;
  currentBody: string;
  /** base_revision 이후 같은 섹션에 반영된 변경들. 뒤처짐을 보여주는 용도 (FR-28). */
  staleChanges: StaleChange[];
};

export async function getEditForReview(editId: string): Promise<EditReviewDetail | null> {
  const DB = await db();
  const row = await DB.prepare(
    `SELECT e.id, d.id AS doc_id, d.position_slug, d.champion_slug, e.me_slug, e.body, e.summary,
            e.created_at, e.base_revision, d.revision AS current_revision, d.general,
            u.name AS author_name
       FROM wiki_edits e
       JOIN wiki_docs d ON d.id = e.doc_id
       LEFT JOIN users u ON u.id = e.author
      WHERE e.id = ?1 AND e.status = 'pending'`,
  )
    .bind(editId)
    .first<{
      id: string;
      doc_id: string;
      position_slug: string;
      champion_slug: string;
      me_slug: string | null;
      body: string;
      summary: string;
      created_at: string;
      base_revision: number;
      current_revision: number;
      general: string;
      author_name: string | null;
    }>();
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
    positionSlug: row.position_slug,
    championSlug: row.champion_slug,
    meSlug: row.me_slug,
    body: row.body,
    summary: row.summary,
    authorName: row.author_name,
    createdAt: row.created_at,
    baseRevision: row.base_revision,
    currentRevision: row.current_revision,
    currentBody,
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

/** 승인. 관리자가 저장 전에 본문을 고칠 수 있다 — 그 경우 반영되는 것은 고친 버전이다. */
export async function approveEdit(
  editId: string,
  input: { reviewerId: string; body?: string; reviewNote: string | null },
): Promise<ReviewActionResult> {
  const DB = await db();
  const now = new Date().toISOString();

  const edit = await DB.prepare(
    `SELECT e.id, e.doc_id, e.me_slug, e.body, e.author, d.revision
       FROM wiki_edits e JOIN wiki_docs d ON d.id = e.doc_id
      WHERE e.id = ?1 AND e.status = 'pending'`,
  )
    .bind(editId)
    .first<{ id: string; doc_id: string; me_slug: string | null; body: string; author: string; revision: number }>();
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

  const [, bumpResult] = await DB.batch([applyStmt, bumpStmt, recordStmt]);
  if ((bumpResult.meta.changes ?? 0) === 0) {
    // 문서가 그 사이 다른 승인으로 또 바뀐 경우. 아주 드물지만 승인 자체를 실패로 알린다 —
    // 검토자가 최신 상태를 다시 보고 승인해야 한다.
    return { ok: false, error: "validation" };
  }
  return { ok: true };
}

export async function rejectEdit(
  editId: string,
  input: { reviewerId: string; reviewNote: string },
): Promise<ReviewActionResult> {
  if (!input.reviewNote.trim()) return { ok: false, error: "validation" };

  const DB = await db();
  const now = new Date().toISOString();
  const result = await DB.prepare(
    `UPDATE wiki_edits SET status = 'rejected', reviewed_at = ?1, reviewer = ?2, review_note = ?3
      WHERE id = ?4 AND status = 'pending'`,
  )
    .bind(now, input.reviewerId, input.reviewNote.trim(), editId)
    .run();

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

export async function listDocHistory(positionSlug: string, championSlug: string): Promise<HistoryRow[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT e.id, e.me_slug, e.summary, u.name AS author_name, e.revision, e.accepted_via,
            e.created_at, e.reviewed_at
       FROM wiki_edits e
       JOIN wiki_docs d ON d.id = e.doc_id
       LEFT JOIN users u ON u.id = e.author
      WHERE d.position_slug = ?1 AND d.champion_slug = ?2 AND e.status = 'accepted'
      ORDER BY e.revision DESC`,
  )
    .bind(positionSlug, championSlug)
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
  positionSlug: string,
  championSlug: string,
  targetRevision: number,
  adminId: string,
): Promise<RevertResult> {
  const DB = await db();
  const now = new Date().toISOString();

  const doc = await DB.prepare(
    `SELECT id, revision, general FROM wiki_docs WHERE position_slug = ?1 AND champion_slug = ?2`,
  )
    .bind(positionSlug, championSlug)
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
  positionSlug: string;
  championSlug: string;
  meSlug: string | null;
  summary: string;
  authorName: string | null;
  acceptedVia: AcceptedVia;
  revision: number;
  createdAt: string;
};

export async function listRecentChanges(limit = 50): Promise<RecentChangeRow[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT e.id, d.position_slug, d.champion_slug, e.me_slug, e.summary, u.name AS author_name,
            e.accepted_via, e.revision, e.created_at
       FROM wiki_edits e
       JOIN wiki_docs d ON d.id = e.doc_id
       LEFT JOIN users u ON u.id = e.author
      WHERE e.status = 'accepted'
      ORDER BY e.created_at DESC
      LIMIT ?1`,
  )
    .bind(limit)
    .all<{
      id: string;
      position_slug: string;
      champion_slug: string;
      me_slug: string | null;
      summary: string;
      author_name: string | null;
      accepted_via: AcceptedVia;
      revision: number;
      created_at: string;
    }>();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    positionSlug: r.position_slug,
    championSlug: r.champion_slug,
    meSlug: r.me_slug,
    summary: r.summary,
    authorName: r.author_name,
    acceptedVia: r.accepted_via,
    revision: r.revision,
    createdAt: r.created_at,
  }));
}
