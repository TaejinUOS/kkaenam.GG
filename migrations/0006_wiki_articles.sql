-- 일반 문서를 위키에 들인다 (`docs/WIKI_EXPANSION.md` 1·2단계).
--
-- 지금까지 `wiki_docs`에는 매치업 문서밖에 없었다. 룬·정글 동선 같은 **일반 문서**를
-- 같은 표에 들인다. 두 저장소로 쪼개면 편집·검토·역사·최근 변경이 전부 두 벌이 되고,
-- "최근 바뀐 문서"를 보려면 두 목록을 번갈아 봐야 한다.
--
--   kind = 'matchup'  →  champion_slug로 식별.  /matchup/ahri
--   kind = 'article'  →  title_key로 식별.      /wiki/정글 동선
--
-- 표를 다시 만들지 않는다. 마이그레이션 0003이 `champion_slug`를 이미 NULL 허용으로
-- 열어 두었으므로 여기서는 열을 더하기만 하면 된다 — 되돌릴 수 없는 작업을 두 번 하지
-- 않으려고 그때 미리 이 모양으로 만들었다.

-- 'matchup' | 'article'. 기존 행은 전부 매치업 문서다.
ALTER TABLE wiki_docs ADD COLUMN kind TEXT NOT NULL DEFAULT 'matchup';

-- 일반 문서의 표시 이름. 예: '정글 동선'. 매치업 문서는 NULL이다 — 그쪽 이름은
-- 챔피언 카탈로그에서 나온다 (`matchupDocTitle`).
ALTER TABLE wiki_docs ADD COLUMN title TEXT;

-- 정규화한 이름(소문자·공백 제거). 주소이자 유일성의 근거다.
-- `[[정글 동선]]`과 `[[정글동선]]`이 같은 문서에 닿아야 한다.
ALTER TABLE wiki_docs ADD COLUMN title_key TEXT;

-- 'published' | 'proposed' | 'rejected'.
-- 승인 전 문서는 목록·링크·검색 어디에도 나오지 않는다. 주소를 아는 제안자와
-- 운영자만 볼 수 있다.
ALTER TABLE wiki_docs ADD COLUMN doc_status TEXT NOT NULL DEFAULT 'published';

-- 이름은 유일하다. **검토 중인 제안도 이름을 잡는다** — 그러지 않으면 승인을 기다리는
-- 동안 같은 문서가 여럿 제안되고 운영자가 그걸 다 읽어야 한다.
--
-- 거절된 제안은 `title_key`를 NULL로 비워 이름을 풀어 준다(행은 남긴다 — 제안자가
-- 「내 편집」에서 거절 사유를 봐야 하고, 행을 지우면 CASCADE로 그 편집까지 사라진다).
-- SQLite의 유일 인덱스는 NULL을 서로 다른 값으로 보므로 여럿 남아도 걸리지 않는다.
CREATE UNIQUE INDEX idx_docs_article ON wiki_docs (title_key)
  WHERE kind = 'article' AND title_key IS NOT NULL;
