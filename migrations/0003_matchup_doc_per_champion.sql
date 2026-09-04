-- 매치업 문서를 챔피언당 하나로 통일한다.
--
-- 왜: 포지션은 **분류이지 정체성이 아니다.** 패치마다 챔피언이 오르내리고, 운영자가
-- 분류를 배포 없이 고칠 수 있게 되면 `(포지션, 챔피언)`을 키로 둔 문서는 분류를 고칠
-- 때마다 생겼다 없어졌다 한다. 이미 쓰인 글이 분류 변경만으로 접근 불가가 되는 것은
-- 위키가 절대 하면 안 되는 일이다. 그래서 문서의 정체성을 챔피언으로 내린다.
--
-- 포지션별 상대법 차이는 사라지지 않는다. 섹션 축이 `내 챔피언`이고, 내 챔피언이
-- 포지션을 이미 함축한다 — `제드로 상대할 때`는 미드 럭스를, `쓰레쉬로 상대할 때`는
-- 서폿 럭스를 말한다. 그래서 포지션 섹션을 따로 두지 않는다.
--
-- 지금 하는 이유: 문서가 7개뿐이고 챔피언이 전부 다르다. 문서가 쌓인 뒤에는
-- "미드 럭스 본문과 서폿 럭스 본문을 어떻게 합칠 것인가"를 사람이 판단해야 한다.

------------------------------------------------------------------ 새 부모 표

-- position_slug를 떼고 champion_slug를 유일 키로 삼는다.
-- champion_slug를 NULL 허용으로 두는 것은 1단계(일반 문서) 때문이다. 그때는 열을
-- 더하기만 하면 되고, 표를 다시 만드는 되돌릴 수 없는 작업을 또 하지 않아도 된다.
CREATE TABLE wiki_docs_new (
  id            TEXT PRIMARY KEY,
  champion_slug TEXT,                   -- 상대 챔피언. 매치업 문서의 유일한 식별자
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

-- 챔피언 하나당 문서 하나. **아래 INSERT보다 먼저 만든다** — 같은 챔피언에 문서가
-- 둘 이상이면 여기서 걸려 마이그레이션이 멈추고, 그 시점에는 아직 아무것도 지우지
-- 않았다. 두 본문을 합치는 것은 사람이 할 판단이지 마이그레이션이 조용히 하나를
-- 버릴 일이 아니다.
--
-- NULL은 서로 다른 값으로 취급되므로 1단계의 일반 문서가 여럿 들어와도 걸리지 않는다.
CREATE UNIQUE INDEX idx_docs_champion ON wiki_docs_new (champion_slug);

-- doc_id는 그대로 옮긴다. wiki_sections·wiki_edits가 전부 이 값을 참조하고 있어
-- 값을 바꾸면 자식 표까지 함께 고쳐야 한다. 식별자는 불투명한 값이므로 옛 꼴
-- (`doc-mid-ahri`)이 남아도 뜻이 틀리지 않는다. 새 문서는 `doc-c-<챔피언>`으로 짓는다.
INSERT INTO wiki_docs_new (
  id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by
)
SELECT id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by
  FROM wiki_docs;

--------------------------------------------------------------- 자식 지키기

-- wiki_sections·wiki_edits가 ON DELETE CASCADE로 wiki_docs를 참조한다. 외래 키가
-- 켜진 채 부모 표를 DROP하면 암묵적 DELETE가 일어나 **자식이 함께 지워진다.**
-- `PRAGMA defer_foreign_keys`는 제약 검사를 미룰 뿐 CASCADE 동작 자체는 막지 못한다
-- (로컬에서 실제로 확인했다: sections 6 → 0, edits 13 → 0).
--
-- 그래서 자식을 제약 없는 임시 표에 옮겨 두었다가 부모를 갈아 끼운 뒤 되돌려 놓는다.
-- doc_id를 그대로 두었으므로 되돌릴 때 외래 키가 그대로 맞는다.
CREATE TABLE wiki_sections_hold AS SELECT * FROM wiki_sections;
CREATE TABLE wiki_edits_hold AS SELECT * FROM wiki_edits;

DROP TABLE wiki_docs;

ALTER TABLE wiki_docs_new RENAME TO wiki_docs;

-- 자식 표는 DROP되지 않고 비워졌을 뿐이라 인덱스와 제약이 그대로 남아 있다.
INSERT INTO wiki_sections SELECT * FROM wiki_sections_hold;
INSERT INTO wiki_edits SELECT * FROM wiki_edits_hold;

DROP TABLE wiki_sections_hold;
DROP TABLE wiki_edits_hold;
