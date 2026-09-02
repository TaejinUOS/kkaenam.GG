-- 상대법 위키 초기 스키마.
-- 설계 근거는 docs/WIKI_MODEL.md. 이 파일과 그 문서가 어긋나면 문서를 고친다.

-- 소셜 로그인 사용자.
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL,          -- 'google' | 'kakao' | 'system'
  provider_id   TEXT NOT NULL,
  name          TEXT NOT NULL,
  -- 제공자가 인증된 이메일을 줄 때만 채운다. 훗날 계정 연결의 근거이고,
  -- 카카오는 이메일 제공이 선택 항목이라 비어 있을 수 있다.
  -- 지금 단계에서 이 값으로 계정을 자동 병합하지 않는다.
  email         TEXT,
  -- 'member' | 'admin'. 검토 권한의 유일한 기준이다.
  role          TEXT NOT NULL DEFAULT 'member',
  created_at    TEXT NOT NULL,
  UNIQUE (provider, provider_id)
);

-- 매치업 문서. (포지션, 상대 챔피언)당 하나.
CREATE TABLE wiki_docs (
  id            TEXT PRIMARY KEY,
  position_slug TEXT NOT NULL,
  champion_slug TEXT NOT NULL,          -- 상대 챔피언
  general       TEXT NOT NULL DEFAULT '',
  revision      INTEGER NOT NULL DEFAULT 0,
  patch         TEXT NOT NULL,
  -- 'guarded' : 빈 섹션은 즉시 반영, 이미 쓰인 섹션은 검토 (기본이자 현재 유일한 구현)
  -- 'open'    : 전부 즉시 반영     ← 신뢰가 쌓인 문서에 쓸 자리
  -- 'locked'  : 전부 검토          ← 도배를 맞은 문서에 쓸 자리
  edit_policy   TEXT NOT NULL DEFAULT 'guarded',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  updated_by    TEXT REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_docs_lookup ON wiki_docs (position_slug, champion_slug);

-- 내 챔피언별 상대법 섹션.
-- 문서 안 JSON이 아니라 별도 표인 이유는, 화면이 늘 "공통 + 선택된 챔피언 섹션 하나"만
-- 필요로 하기 때문이다. 문서 전체를 읽어 버릴 필요가 없다.
CREATE TABLE wiki_sections (
  doc_id        TEXT NOT NULL REFERENCES wiki_docs(id) ON DELETE CASCADE,
  me_slug       TEXT NOT NULL,          -- 내 챔피언
  body          TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  updated_by    TEXT REFERENCES users(id),
  PRIMARY KEY (doc_id, me_slug)
);

-- 편집 제안이자 문서의 역사. 승인된 행이 곧 리비전이다.
-- body가 차이가 아니라 섹션 전문이라, 특정 리비전의 문서를 되짚기 쉽다.
CREATE TABLE wiki_edits (
  id            TEXT PRIMARY KEY,
  doc_id        TEXT NOT NULL REFERENCES wiki_docs(id) ON DELETE CASCADE,
  me_slug       TEXT,                   -- NULL이면 공통 섹션
  -- 제안을 쓸 때 보고 있던 문서 리비전. 잠금이 아니라 검토자에게 주는 정보다.
  base_revision INTEGER NOT NULL,
  body          TEXT NOT NULL,          -- 섹션 전문
  summary       TEXT NOT NULL DEFAULT '',
  -- 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  status        TEXT NOT NULL DEFAULT 'pending',
  author        TEXT REFERENCES users(id),
  created_at    TEXT NOT NULL,
  -- 'empty_section' | 'review' | 'admin'. 승인된 경우에만 채워진다.
  -- 검토를 거치지 않은 승인을 구분해 두어야 최근 변경 피드에서 걸러 볼 수 있다.
  accepted_via  TEXT,
  reviewed_at   TEXT,                   -- 사람이 검토한 경우에만
  reviewer      TEXT REFERENCES users(id),
  review_note   TEXT,
  revision      INTEGER                 -- 승인된 경우 이 편집이 만든 문서 리비전
);

-- 검토 대기열: 오래된 제안부터
CREATE INDEX idx_edits_pending ON wiki_edits (status, created_at);
-- 문서 역사: 최신 리비전부터
CREATE INDEX idx_edits_history ON wiki_edits (doc_id, revision DESC);
-- 최근 변경 피드: 검토 없이 반영된 편집을 훑어보기 위한 것
CREATE INDEX idx_edits_recent  ON wiki_edits (created_at DESC, accepted_via);
