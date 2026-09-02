/**
 * 상대법 위키 조회 — D1 접근 계층.
 *
 * `server-only`를 import해 이 모듈이 클라이언트 번들에 섞이면 빌드가 실패하게 한다.
 * D1 바인딩은 서버에만 있으므로, 실수로 클라이언트에서 부르면 런타임에야 알게 된다.
 *
 * 설계는 `docs/WIKI_MODEL.md`, 스키마는 `migrations/0001_init.sql`.
 * 쓰기(편집 제안·검토)는 아직 없다. 4단계에서 추가한다.
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { EditPolicy } from "@/data/wiki";

/** 화면 하나가 필요로 하는 만큼의 문서. 문서 전체를 읽지 않는다. */
export type WikiView = {
  /** 문서가 아직 없으면 false. 이때 general은 빈 문자열이다. */
  exists: boolean;
  general: string;
  revision: number;
  patch: string | null;
  editPolicy: EditPolicy;
  updatedAt: string | null;
  /** 마지막으로 반영한 사람의 표시 이름. */
  updatedBy: string | null;
  /** 선택한 내 챔피언의 섹션. 고르지 않았거나 비어 있으면 null. */
  meSection: MeSectionView | null;
  /** 내용이 있는 내 챔피언 슬러그. 어디에 글이 있는지 안내하는 데 쓴다. */
  filledMeSlugs: string[];
};

export type MeSectionView = {
  championSlug: string;
  body: string;
  updatedAt: string;
  updatedBy: string | null;
};

type DocRow = {
  id: string;
  general: string;
  revision: number;
  patch: string;
  edit_policy: string;
  updated_at: string;
  updated_by_name: string | null;
};

type SectionRow = {
  me_slug: string;
  body: string;
  updated_at: string;
  updated_by_name: string | null;
};

async function db() {
  // async 형태로 부르는 이유는 빌드 중 렌더링에서도 안전하게 동작하기 위해서다.
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

/** 문서가 없을 때 돌려주는 빈 상태. 대부분의 매치업이 처음에는 여기에 해당한다. */
function emptyView(): WikiView {
  return {
    exists: false,
    general: "",
    revision: 0,
    patch: null,
    editPolicy: "guarded",
    updatedAt: null,
    updatedBy: null,
    meSection: null,
    filledMeSlugs: [],
  };
}

/**
 * 매치업 문서를 읽는다. `meSlug`를 주면 그 챔피언의 섹션 하나만 함께 읽는다.
 *
 * 섹션을 별도 표에 둔 덕분에 문서 전체를 읽지 않아도 된다 (`docs/WIKI_MODEL.md`).
 */
export async function getWikiView(
  positionSlug: string,
  championSlug: string,
  meSlug: string | null,
): Promise<WikiView> {
  const DB = await db();

  const doc = await DB.prepare(
    `SELECT d.id, d.general, d.revision, d.patch, d.edit_policy, d.updated_at,
            u.name AS updated_by_name
       FROM wiki_docs d
       LEFT JOIN users u ON u.id = d.updated_by
      WHERE d.position_slug = ?1 AND d.champion_slug = ?2`,
  )
    .bind(positionSlug, championSlug)
    .first<DocRow>();

  if (!doc) return emptyView();

  /*
   * 내용이 있는 섹션 목록과, 선택된 섹션 본문을 한 번씩 읽는다.
   * 목록 조회에서 body를 가져오지 않는 이유는 섹션이 길어질 수 있어서다.
   */
  const [filled, section] = await Promise.all([
    DB.prepare(
      `SELECT me_slug FROM wiki_sections
        WHERE doc_id = ?1 AND TRIM(body) <> ''
        ORDER BY me_slug`,
    )
      .bind(doc.id)
      .all<{ me_slug: string }>(),
    meSlug
      ? DB.prepare(
          `SELECT s.me_slug, s.body, s.updated_at, u.name AS updated_by_name
             FROM wiki_sections s
             LEFT JOIN users u ON u.id = s.updated_by
            WHERE s.doc_id = ?1 AND s.me_slug = ?2`,
        )
          .bind(doc.id, meSlug)
          .first<SectionRow>()
      : Promise.resolve(null),
  ]);

  return {
    exists: true,
    general: doc.general,
    revision: doc.revision,
    patch: doc.patch,
    editPolicy: doc.edit_policy as EditPolicy,
    updatedAt: doc.updated_at,
    updatedBy: doc.updated_by_name,
    meSection:
      section && section.body.trim()
        ? {
            championSlug: section.me_slug,
            body: section.body,
            updatedAt: section.updated_at,
            updatedBy: section.updated_by_name,
          }
        : null,
    filledMeSlugs: (filled.results ?? []).map((r) => r.me_slug),
  };
}
