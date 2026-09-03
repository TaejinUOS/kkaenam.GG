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

/**
 * 한 매치업 문서 전체.
 *
 * 예전에는 "공통 + 선택된 섹션 하나"만 읽었다. 상대법이 목차 하나를 가진 **한 문서**로
 * 합쳐지면서(`docs/WIKI_MODEL.md` "문서 구조") 내용이 있는 섹션을 모두 읽는다. 내 챔피언
 * 선택은 걸러내기가 아니라 그 제목으로 옮겨 가는 일이라, 읽는 양이 선택과 무관하다.
 *
 * 그 덕에 이 조회 결과는 `?me=`에 좌우되지 않는다. 매치업 하나당 결과가 하나뿐이다.
 */
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
  /** 내용이 있는 내 챔피언 섹션 전부. 비어 있는 섹션은 담기지 않는다. */
  meSections: MeSectionView[];
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
    meSections: [],
  };
}

/**
 * 매치업 문서를 통째로 읽는다.
 *
 * `wiki_sections`를 별도 표로 둔 것은 이제 읽는 양을 줄이기 위해서가 아니라, 섹션이
 * 편집 단위이자 즉시반영·검토 판정 단위이기 때문이다 (`docs/WIKI_MODEL.md`).
 */
export async function getWikiView(
  positionSlug: string,
  championSlug: string,
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
   * 내용이 있는 섹션을 본문까지 한 번에 읽는다. 화면이 문서 전체를 그리므로
   * 목록과 본문을 나눠 읽을 이유가 없어졌다.
   *
   * 빈 섹션을 제외하는 것은 목차를 지키기 위해서다. 챔피언이 170명이라 빈 섹션까지
   * 실으면 목차가 아무도 읽지 않는 항목으로 뒤덮인다.
   */
  const sections = await DB.prepare(
    `SELECT s.me_slug, s.body, s.updated_at, u.name AS updated_by_name
       FROM wiki_sections s
       LEFT JOIN users u ON u.id = s.updated_by
      WHERE s.doc_id = ?1 AND TRIM(s.body) <> ''
      ORDER BY s.me_slug`,
  )
    .bind(doc.id)
    .all<SectionRow>();

  return {
    exists: true,
    general: doc.general,
    revision: doc.revision,
    patch: doc.patch,
    editPolicy: doc.edit_policy as EditPolicy,
    updatedAt: doc.updated_at,
    updatedBy: doc.updated_by_name,
    meSections: (sections.results ?? []).map((row) => ({
      championSlug: row.me_slug,
      body: row.body,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by_name,
    })),
  };
}
