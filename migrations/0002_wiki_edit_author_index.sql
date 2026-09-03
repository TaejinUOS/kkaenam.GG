-- 계정별 편집 이력 조회용 인덱스.
-- FR-32(시간당 제출 상한)의 카운트 쿼리와 FR-33(내 편집)의 목록 쿼리가 함께 쓴다.
CREATE INDEX idx_edits_author ON wiki_edits (author, created_at DESC);
