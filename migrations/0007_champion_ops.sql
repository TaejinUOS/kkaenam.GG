-- 챔피언 운영 상태 (PRD FR-39).
--
-- 리메이크로 잠시 내려가거나, 카탈로그 데이터가 깨져 손봐야 하는 챔피언이 생긴다.
-- 그때 배포 없이 **찾는 길에서만** 빼기 위한 표다.
--
-- **문서는 감추지 않는다.** 비활성 챔피언도 `/matchup/<슬러그>`는 그대로 열리고
-- 편집도 계속 받는다. 마이그레이션 0003이 문서를 챔피언에 매달면서 세운 원칙
-- ("분류를 고쳐도 이미 쓰인 글은 제자리에 있다")에 예외를 만들지 않기 위해서다 —
-- 리메이크 기간에 쓴 글이 접근 불가가 되는 것은 위키가 해서는 안 되는 일이다.
--
-- 173명을 미리 넣지 않는다. 카탈로그의 원본은 Data Dragon이고 D1은 **운영이 손댄
-- 예외만** 갖는다. `champion_placements`가 배정만 갖는 것과 같은 성질이다.
CREATE TABLE champion_ops (
  champion_slug TEXT PRIMARY KEY,
  -- 1이면 활성. 행이 없는 챔피언도 활성이다.
  active        INTEGER NOT NULL DEFAULT 1,
  -- 왜 내렸는지 한 줄. 이 값이 FR-43(분류 변경 이력)의 절반을 미리 채운다.
  note          TEXT,
  updated_at    TEXT NOT NULL,
  updated_by    TEXT REFERENCES users(id)
);

-- 내려간 챔피언만 훑는 조회가 대부분이다.
CREATE INDEX idx_champion_ops_active ON champion_ops (active);
