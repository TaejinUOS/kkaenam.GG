/**
 * 상대법 위키의 도메인 타입.
 *
 * 설계 근거는 `docs/WIKI_MODEL.md`이고, 저장 구조는 `migrations/0001_init.sql`이다.
 * 셋이 어긋나면 문서를 기준으로 코드와 스키마를 맞춘다.
 *
 * 이 파일은 타입만 둔다. D1 접근은 서버에서만 이루어지므로 조회 함수는 별도 모듈에 둔다.
 */

/** 편집을 만든 사람. 시드 이관분은 시스템 계정으로 기록된다. */
export type Editor = {
  id: string;
  name: string;
};

/** 내 챔피언별 상대법 섹션. 문서 안에서 `championSlug`가 유일하다. */
export type MeSection = {
  /** 내 챔피언 슬러그. */
  championSlug: string;
  body: string;
  updatedAt: string;
  updatedBy: Editor | null;
};

/** 매치업 위키 문서. `(positionSlug, championSlug)`당 하나. */
export type WikiDoc = {
  id: string;
  positionSlug: string;
  /** 상대 챔피언 슬러그. */
  championSlug: string;
  /** 공통 상대법. 내 챔피언과 무관하게 항상 보인다. */
  general: string;
  meSections: MeSection[];
  /** 승인된 편집이 반영될 때마다 1씩 오른다. */
  revision: number;
  patch: string;
  editPolicy: EditPolicy;
  createdAt: string;
  updatedAt: string;
  updatedBy: Editor | null;
};

/**
 * 문서별 편집 정책.
 * 지금은 `guarded`만 구현한다. 나머지는 실제 문제가 생긴 뒤에 켠다.
 */
export type EditPolicy =
  /** 빈 섹션은 즉시 반영, 이미 쓰인 섹션은 검토. */
  | "guarded"
  /** 전부 즉시 반영. 신뢰가 쌓인 문서에 쓴다. */
  | "open"
  /** 전부 검토. 도배를 맞은 문서에 쓴다. */
  | "locked";

export type EditStatus = "pending" | "accepted" | "rejected" | "withdrawn";

/**
 * 승인이 어느 경로로 이루어졌는지. 최근 변경 피드와 감사가 이 값을 쓴다.
 * 검토를 거치지 않은 승인을 구분할 수 없으면 도배를 걸러 볼 수 없다.
 */
export type AcceptedVia =
  /** 빈 섹션을 처음 채운 것이라 검토 없이 즉시 반영됨. */
  | "empty_section"
  /** 이미 쓰인 섹션에 지운 것 없이 더하기만 해서 즉시 반영됨. */
  | "addition_only"
  /** 운영자가 검토해 승인함. */
  | "review"
  /** 운영자 본인의 편집이라 제출과 동시에 반영됨. */
  | "admin";

/** 사람의 검토를 거치지 않고 게시된 경로. 최근 변경 피드가 이 목록을 눈에 띄게 만든다. */
export const UNREVIEWED_VIA: readonly AcceptedVia[] = ["empty_section", "addition_only"];

export function isUnreviewed(via: AcceptedVia): boolean {
  return UNREVIEWED_VIA.includes(via);
}

/** 최근 변경 피드와 문서 역사가 함께 쓰는 이름표. 두 화면이 다른 말을 쓰면 안 된다. */
export const ACCEPTED_VIA_LABEL: Record<AcceptedVia, string> = {
  empty_section: "빈 곳 채움",
  addition_only: "더하기만",
  review: "검토 승인",
  admin: "관리자",
};

/**
 * 편집 제안. 승인된 제안이 그대로 문서의 역사가 된다.
 * `body`가 차이가 아니라 섹션 전문이라 특정 리비전의 문서를 되짚기 쉽다.
 */
export type WikiEdit = {
  id: string;
  docId: string;
  /** 고치려는 섹션. null이면 공통 섹션. */
  meSlug: string | null;
  /** 제안을 쓸 때 보고 있던 문서 리비전. 잠금이 아니라 검토자에게 주는 정보다. */
  baseRevision: number;
  /** 섹션 전문. 차이가 아니다. */
  body: string;
  /** 편집 요약. 예: "Q 쿨타임 수정" */
  summary: string;
  status: EditStatus;
  author: Editor | null;
  createdAt: string;
  /** 승인된 경우에만 채워진다. */
  acceptedVia: AcceptedVia | null;
  /** 사람이 검토한 경우에만 채워진다. 즉시 반영이면 null. */
  reviewedAt: string | null;
  reviewer: Editor | null;
  reviewNote: string | null;
  /** 승인된 경우 이 편집이 만든 문서 리비전. */
  revision: number | null;
};

/* -------------------------------------------------------------- 문서 가리키기 */

/**
 * 문서의 종류. 한 이름 공간에 둘이 함께 산다 (`docs/WIKI_EXPANSION.md`).
 *
 *   matchup — champion_slug로 식별. `/matchup/ahri`
 *   article — title_key로 식별.     `/wiki/정글 동선`
 */
export type DocKind = "matchup" | "article";

/**
 * 일반 문서의 게시 상태.
 *
 * `proposed`는 **어디에도 나오지 않는다** — 목록·분류·검색·링크 해석이 모두
 * `published`만 본다. 주소를 아는 제안자와 운영자만 볼 수 있다.
 * `rejected`는 이름을 놓아준 뒤 남는 껍데기다. 「내 편집」이 거절 사유를 보여
 * 주려면 편집 행이 살아 있어야 하고, 그러려면 부모 행도 남아야 한다.
 */
export type DocStatus = "published" | "proposed" | "rejected";

/**
 * 문서를 가리키는 법. 편집·검토·역사·되돌리기가 챔피언 슬러그 대신 이 값을 받는다.
 *
 * 주소를 다루는 얇은 층만 한 단계 올린 것이다 — 그 아래 편집 판정과 저장은 문서
 * 종류를 묻지 않는다.
 */
export type DocRef =
  | { kind: "matchup"; championSlug: string }
  | { kind: "article"; titleKey: string };

/**
 * 저장소가 돌려주는 문서의 정체. `DocRef`가 "어디를 가리키는가"라면 이쪽은
 * "그게 무엇이었는가"다 — 이름과 상태가 함께 온다.
 *
 * 이름·주소·섹션 이름을 짓는 것은 `lib/wikiDocTarget.ts`가 한 곳에서 맡는다.
 */
export type DocTarget =
  | { kind: "matchup"; championSlug: string }
  | { kind: "article"; title: string; titleKey: string; status: DocStatus };

/** 폼 필드 하나로 실어 보내는 꼴. `matchup:ahri` · `article:정글동선`. */
export function encodeDocRef(ref: DocRef): string {
  return ref.kind === "matchup" ? `matchup:${ref.championSlug}` : `article:${ref.titleKey}`;
}

/**
 * 폼에서 온 문자열을 문서 참조로 되돌린다. 꼴이 틀리면 null.
 *
 * 값이 가리키는 문서가 실제로 있는지는 보지 않는다. 그 판정은 저장 시점에 D1이 한다 —
 * 클라이언트가 보낸 값으로 문서의 존재를 주장하게 두지 않는다.
 */
export function parseDocRef(raw: string): DocRef | null {
  const colon = raw.indexOf(":");
  if (colon <= 0) return null;
  const value = raw.slice(colon + 1).trim();
  if (!value) return null;

  const kind = raw.slice(0, colon);
  if (kind === "matchup") return { kind: "matchup", championSlug: value };
  if (kind === "article") return { kind: "article", titleKey: value };
  return null;
}

export type UserRole = "member" | "admin";

export type WikiUser = {
  id: string;
  provider: "google" | "kakao" | "system";
  name: string;
  role: UserRole;
  createdAt: string;
};

/** 시드 이관분과 자동 생성물의 작성자로 쓰는 고정 계정. */
export const SYSTEM_USER_ID = "user-system";

/** 섹션 본문 최대 길이 (PRD 15 미결정 5번 해소, 2026-09-03). 마크다운 문법 포함 글자 수다. */
export const MAX_BODY_LENGTH = 4000;

/** 편집 요약 최대 길이. 선택 입력이며 비우면 빈 문자열로 저장한다 (미결정 6번 해소). */
export const MAX_SUMMARY_LENGTH = 80;

/** 계정당 시간당 편집 제출 상한 (미결정 7번 해소). FR-32. */
export const RATE_LIMIT_PER_HOUR = 10;

/**
 * 섹션이 비어 있는지 판정한다.
 *
 * 이 판정이 "즉시 반영"과 "검토 대기"를 가르므로 반드시 서버에서, 저장 시점의
 * 실제 값으로 불러야 한다. 편집기를 열 때 비어 있었다는 클라이언트의 주장은 믿지 않는다.
 * 공백만 남은 본문도 비어 있는 것으로 본다.
 */
export function isEmptyBody(body: string | null | undefined): boolean {
  return !body || body.trim().length === 0;
}
