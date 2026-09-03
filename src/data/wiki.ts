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
  /** 빈 섹션이라 검토 없이 즉시 반영됨. */
  | "empty_section"
  /** 운영자가 검토해 승인함. */
  | "review"
  /** 운영자 본인의 편집이라 제출과 동시에 반영됨. */
  | "admin";

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
