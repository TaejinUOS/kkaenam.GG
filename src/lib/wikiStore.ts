/**
 * 상대법 위키 조회 — D1 접근 계층.
 *
 * `server-only`를 import해 이 모듈이 클라이언트 번들에 섞이면 빌드가 실패하게 한다.
 * D1 바인딩은 서버에만 있으므로, 실수로 클라이언트에서 부르면 런타임에야 알게 된다.
 *
 * 설계는 `docs/WIKI_MODEL.md`, 스키마는 `migrations/`. 쓰기(편집 제안·검토·문서 생성)는
 * `wikiEditStore.ts`에 있고, 위키 전체를 훑는 집계는 `wikiIndexStore.ts`에 있다.
 *
 * 문서는 두 종류다 — 매치업 문서와 일반 문서 (`docs/WIKI_EXPANSION.md`). 여기에는
 * **문서 하나를 읽는** 조회만 둔다.
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { DocStatus, EditPolicy } from "@/data/wiki";
import { resolveWikiLinks, unresolvedWikiTitles, type WikiLinkMap } from "@/lib/wikiLink";
import { CATEGORY_PREFIX, parseCategoryName } from "@/lib/wikiMarkup";
import { titleKey } from "@/lib/wikiTitle";

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
 * 매치업 문서를 통째로 읽는다. **챔피언 하나당 문서 하나다** (마이그레이션 0003).
 * 포지션은 분류일 뿐이라 문서를 찾는 데 쓰지 않는다.
 *
 *
 * `wiki_sections`를 별도 표로 둔 것은 이제 읽는 양을 줄이기 위해서가 아니라, 섹션이
 * 편집 단위이자 즉시반영·검토 판정 단위이기 때문이다 (`docs/WIKI_MODEL.md`).
 */
export async function getWikiView(championSlug: string): Promise<WikiView> {
  const DB = await db();

  const doc = await DB.prepare(
    `SELECT d.id, d.general, d.revision, d.patch, d.edit_policy, d.updated_at,
            u.name AS updated_by_name
       FROM wiki_docs d
       LEFT JOIN users u ON u.id = d.updated_by
      WHERE d.champion_slug = ?1`,
  )
    .bind(championSlug)
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

/* ------------------------------------------------------------------ 일반 문서 */

/**
 * 일반 문서 한 장. 룬·정글 동선처럼 매치업에 매이지 않은 문서다.
 *
 * 지금은 본문 하나뿐이다. 이름 붙은 섹션은 3단계에서 들어오고, 그때 이 타입에
 * 섹션 목록이 붙는다 — `wiki_sections`는 이미 `doc_id` 기준이라 표는 그대로다.
 */
export type ArticleView = {
  id: string;
  title: string;
  titleKey: string;
  status: DocStatus;
  body: string;
  revision: number;
  updatedAt: string | null;
  updatedBy: string | null;
  /** 승인 전 문서를 누가 냈는지. 그 사람과 운영자만 볼 수 있다. */
  proposedBy: string | null;
};

type ArticleRow = {
  id: string;
  title: string;
  title_key: string;
  doc_status: string;
  general: string;
  revision: number;
  updated_at: string;
  updated_by_name: string | null;
  proposer_id: string | null;
};

/**
 * 이름으로 일반 문서를 읽는다. 없으면 null — 그때 화면은 "아직 없는 문서"로 초대한다.
 *
 * `proposed` 문서도 함께 돌려준다. 목록·검색·링크에는 나오지 않지만 **주소를 아는
 * 제안자와 운영자는 볼 수 있어야** 하기 때문이다. 누구에게 보일지는 화면이 정한다.
 * 거절된 문서는 `title_key`가 비워져 있어 애초에 여기 걸리지 않는다.
 */
export async function getArticleView(key: string): Promise<ArticleView | null> {
  const DB = await db();

  const row = await DB.prepare(
    `SELECT d.id, d.title, d.title_key, d.doc_status, d.general, d.revision, d.updated_at,
            u.name AS updated_by_name,
            (SELECT e.author FROM wiki_edits e
               WHERE e.doc_id = d.id AND e.status = 'pending' AND e.me_slug IS NULL
               ORDER BY e.created_at ASC LIMIT 1) AS proposer_id
       FROM wiki_docs d
       LEFT JOIN users u ON u.id = d.updated_by
      WHERE d.kind = 'article' AND d.title_key = ?1`,
  )
    .bind(key)
    .first<ArticleRow>();

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    titleKey: row.title_key,
    status: row.doc_status as DocStatus,
    body: row.general,
    revision: row.revision,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by_name,
    proposedBy: row.proposer_id,
  };
}

/**
 * 한 번에 물어볼 수 있는 이름 수.
 *
 * 본문 하나에 적히는 링크는 보통 몇 개뿐이라 이 한도에 닿을 일이 없다. 도배로
 * `[[...]]`를 수백 개 적은 본문이 조회 하나를 부풀리지 못하게 막는 자리다.
 */
const LINK_LOOKUP_LIMIT = 100;

/**
 * 본문에 적힌 `[[...]]`를 주소로 푼다 — 매치업 문서와 일반 문서 둘 다.
 *
 * 매치업 갈래는 카탈로그만으로 풀리므로 D1에 묻지 않는다. 남은 이름만 모아 한 번
 * 조회한다. 승인 전(`proposed`) 문서는 걸리지 않는다 — 아직 없는 문서와 같이 취급해야
 * 승인 전 이름이 링크를 통해 새어 나가지 않는다.
 *
 * 분류(`분류:이름`)는 조회 후보에서 뺀다 — `linkifyWikiLinks`가 애초에 그 갈래를
 * `resolve()`로 넘기지 않고 지우므로, 여기서 결과를 만들어도 아무도 읽지 않는다.
 * `unresolvedWikiTitles` 자체에서 빼면 안 된다 — 그 함수는 `wiki_links` 저장
 * 후보이기도 해서, 거기서 빼면 분류가 저장되지 않는다(`wikiEditStore.ts`의
 * `linkStatements`가 겪었던 문제).
 */
export async function resolveDocLinks(bodies: string[]): Promise<WikiLinkMap> {
  const unresolved = unresolvedWikiTitles(bodies)
    .filter((title) => !parseCategoryName(title))
    .slice(0, LINK_LOOKUP_LIMIT);
  if (unresolved.length === 0) return resolveWikiLinks(bodies);

  const keys = [...new Set(unresolved.map(titleKey))];
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT title, title_key FROM wiki_docs
      WHERE kind = 'article' AND doc_status = 'published'
        AND title_key IN (${keys.map((_, i) => `?${i + 1}`).join(", ")})`,
  )
    .bind(...keys)
    .all<{ title: string; title_key: string }>();

  const articles = new Map((rows.results ?? []).map((row) => [row.title_key, row.title]));
  return resolveWikiLinks(bodies, articles);
}

/* -------------------------------------------------------------------- 분류 */

/*
 * 이 절의 타입은 `wikiIndex.ts`가 값(함수) 없이 타입만 가져다 쓴다 — `wikiIndex.ts`는
 * 클라이언트 컴포넌트(`WikiIndexScreen.tsx`)가 값으로 import하므로, 이 표를 다루는
 * 계산 함수(예: 트리를 훑어 문서를 모으는 것)를 여기 두면 그 함수를 부르는 순간
 * `wikiIndex.ts` 전체가 `server-only`를 끌어들여 클라이언트 빌드가 깨진다. 그런
 * 순수 계산은 `wikiIndex.ts` 쪽에 둔다(`collectCategoryDocs`).
 */
export type CategoryMember = { title: string; titleKey: string; updatedAt: string | null };

/** 분류 나무의 한 갈래(하위분류 하나). 재귀적으로 그 아래 하위분류를 전부 담는다. */
export type CategoryNode = {
  name: string;
  /** 이 분류에 바로 속한 문서. 하위분류 문서(제목이 `분류:`로 시작하는 것)는 제외한다. */
  docs: CategoryMember[];
  /** 이 분류를 상위로 적은(`[[분류:이 이름]]`) 하위분류. */
  subcategories: CategoryNode[];
};

export type CategoryView = {
  docs: CategoryMember[];
  subcategories: CategoryNode[];
};

/** 순환·과도한 깊이를 막는 안전판. 실제로 이 깊이까지 쓸 일은 거의 없다. */
const MAX_CATEGORY_DEPTH = 12;

/**
 * 한 분류(`[[분류:이름]]`)에 속한 문서를 읽는다. 하위분류는 **끝까지** 재귀적으로
 * 따라간다 — "분류:라인전" 문서를 열면 라인전 → 라인관리 → 그 아래 하위분류까지
 * 전부 펼쳐서 보여줘야 한다.
 *
 * `wiki_links`는 매치업으로 안 풀리는 이름을 전부 담으므로(`wikiEditStore.ts`의
 * `linkStatements`), 분류도 새 저장소 없이 이 표 하나로 찾는다
 * (`docs/WIKI_EXPANSION.md` "분류 자체는 새 저장소가 없다").
 *
 * 순환(`분류:A`가 `분류:B`를, `분류:B`가 다시 `분류:A`를 상위로 적는 경우)은 **그 경로
 * 위에서만** 막는다 — 같은 분류가 서로 다른 두 상위 아래 나란히 있는 것(다이아몬드
 * 모양)은 순환이 아니라 각자 온전히 펼쳐져야 한다. 그래서 "지금까지 온 경로"만 도는
 * `ancestors` 집합을 재귀 호출마다 새로 만든다 — 형제 가지끼리 공유하지 않는다.
 */
export async function getCategoryView(name: string): Promise<CategoryView> {
  const DB = await db();
  const { docs, subNames } = await splitMembers(DB, name);

  const ancestors = new Set([name]);
  const subcategories = await Promise.all(
    subNames.map((subName) => buildCategoryNode(DB, subName, ancestors, 1)),
  );

  return { docs, subcategories };
}

async function buildCategoryNode(
  DB: D1Database,
  name: string,
  ancestors: ReadonlySet<string>,
  depth: number,
): Promise<CategoryNode> {
  if (ancestors.has(name) || depth >= MAX_CATEGORY_DEPTH) {
    return { name, docs: [], subcategories: [] };
  }

  const { docs, subNames } = await splitMembers(DB, name);
  const nextAncestors = new Set(ancestors).add(name);
  const subcategories = await Promise.all(
    subNames.map((subName) => buildCategoryNode(DB, subName, nextAncestors, depth + 1)),
  );

  return { name, docs, subcategories };
}

async function splitMembers(
  DB: D1Database,
  name: string,
): Promise<{ docs: CategoryMember[]; subNames: string[] }> {
  const members = await categoryMembers(DB, name);
  const docs: CategoryMember[] = [];
  const subNames: string[] = [];
  for (const member of members) {
    const subName = parseCategoryName(member.title);
    if (subName) subNames.push(subName);
    else docs.push(member);
  }
  return { docs, subNames };
}

async function categoryMembers(DB: D1Database, name: string): Promise<CategoryMember[]> {
  const key = titleKey(`${CATEGORY_PREFIX}${name}`);
  const rows = await DB.prepare(
    `SELECT d.title, d.title_key, d.updated_at
       FROM wiki_links l JOIN wiki_docs d ON d.id = l.source_doc
      WHERE l.target_key = ?1 AND d.kind = 'article' AND d.doc_status = 'published'
      ORDER BY d.title`,
  )
    .bind(key)
    .all<{ title: string; title_key: string; updated_at: string }>();

  return (rows.results ?? []).map((r) => ({
    title: r.title,
    titleKey: r.title_key,
    updatedAt: r.updated_at,
  }));
}

/**
 * 어떤 분류에도 안 걸린, 게시된 일반 문서 (`/wiki` 04 구역의 "분류 없음" 통).
 *
 * 분류 문서 자신("분류:라인전" 같은)은 뺀다 — 그 문서가 상위 분류를 안 적었다고 해서
 * "분류를 안 단 일반 글"과 같은 뜻은 아니다.
 */
export async function listUncategorizedArticles(): Promise<CategoryMember[]> {
  const DB = await db();
  const rows = await DB.prepare(
    `SELECT d.title, d.title_key, d.updated_at
       FROM wiki_docs d
      WHERE d.kind = 'article' AND d.doc_status = 'published'
        AND d.title NOT LIKE ?1
        AND NOT EXISTS (
          SELECT 1 FROM wiki_links l WHERE l.source_doc = d.id AND l.target_key LIKE ?1
        )
      ORDER BY d.title`,
  )
    .bind(`${CATEGORY_PREFIX}%`)
    .all<{ title: string; title_key: string; updated_at: string }>();

  return (rows.results ?? []).map((r) => ({
    title: r.title,
    titleKey: r.title_key,
    updatedAt: r.updated_at,
  }));
}
