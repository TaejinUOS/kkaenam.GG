-- 위키링크 그래프. "아직 없는 문서"(4단계, docs/WIKI_EXPANSION.md "아직 없는 문서 목록")의
-- 근거다. 섹션을 저장할 때 그 섹션의 링크를 지우고 다시 넣는다.
--
-- 매치업 문서를 가리키는 링크(`[[아리 상대법]]` 등)는 담지 않는다. 챔피언 카탈로그에
-- 있으면 문서가 비어 있어도 주소가 항상 열려 있어(`resolveWikiTitle`) "아직 없는 문서"가
-- 아니다. 그 목록은 이미 taxonomy 기반으로 따로 있다(`getWikiIndexStats`). 여기 담기는
-- target_key는 전부 "매치업으로 안 풀리는 이름" — 일반 문서의 후보뿐이다
-- (`unresolvedWikiTitles`).
CREATE TABLE wiki_links (
  source_doc   TEXT NOT NULL REFERENCES wiki_docs(id) ON DELETE CASCADE,
  source_key   TEXT,              -- 어느 섹션에서 걸었는지. NULL이면 본문(공통)
  target_key   TEXT NOT NULL,     -- 정규화한 대상 이름 (wikiTitle.ts의 titleKey)
  target_title TEXT NOT NULL,     -- 실제로 적힌 이름. 목록에 보여줄 표시용 (마지막에 본 값)
  PRIMARY KEY (source_doc, source_key, target_key)
);

-- "많이 걸린 이름부터" 집계할 때 쓴다.
CREATE INDEX idx_links_target ON wiki_links (target_key);
