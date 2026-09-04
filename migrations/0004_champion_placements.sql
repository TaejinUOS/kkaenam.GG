-- 챔피언 배치 — 어느 포지션의 어느 카테고리에 속하는가.
--
-- 분류는 패치마다 바뀐다. 원래 미드에 없던 챔피언이 올라오고, 있던 챔피언이 내려간다.
-- 그때마다 배포를 하는 것은 운영이 아니므로(PRD 3.1-6) 이 값을 코드에서 표로 옮긴다.
-- 이후 변경은 `/admin/taxonomy`에서 하고, `src/data/taxonomy.ts`의 roster는 이 초기
-- 데이터를 만든 근거로만 남는다.
--
-- 문서는 이 표에 딸리지 않는다. 매치업 문서의 식별자는 챔피언이므로(마이그레이션 0003)
-- 배치를 아무리 고쳐도 이미 쓰인 글은 그대로 있다. 그게 0003을 먼저 한 이유다.

CREATE TABLE champion_placements (
  position_slug TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  champion_slug TEXT NOT NULL,
  -- 카테고리 안에서의 순서. Contact Sheet가 이 순서로 늘어놓는다.
  sort_order    INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL,
  updated_by    TEXT REFERENCES users(id),
  -- 한 포지션에서 한 챔피언은 카테고리 하나에만 속한다.
  PRIMARY KEY (position_slug, champion_slug)
);

-- 포지션·카테고리별 조회가 이 표의 유일한 읽기 패턴이다.
CREATE INDEX idx_placements_category ON champion_placements (position_slug, category_slug, sort_order);

-- 아래는 `src/data/taxonomy.ts`의 roster를 그대로 옮긴 것이다.

INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'ornn', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'malphite', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'shen', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'ksante', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'sion', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'chogath', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'poppy', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'maokai', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'nasus', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'zac', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'tahmkench', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'tank', 'drmundo', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'aatrox', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'darius', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'garen', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'renekton', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'sett', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'riven', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'irelia', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'fiora', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'jax', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'camille', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'gangplank', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'urgot', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'yorick', 13, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'mordekaiser', 14, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'kled', 15, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'gwen', 16, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'volibear', 17, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'tryndamere', 18, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'ambessa', 19, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'gnar', 20, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'olaf', 21, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'bruiser', 'illaoi', 22, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'teemo', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'quinn', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'kennen', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'vladimir', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'rumble', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'kayle', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'akshan', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'heimerdinger', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'singed', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('top', 'damage', 'lissandra', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'leesin', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'viego', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'graves', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'kindred', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'rengar', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'khazix', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'hecarim', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'jarvaniv', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'vi', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'xinzhao', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'masteryi', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'trundle', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'nidalee', 13, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'belveth', 14, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'briar', 15, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'reksai', 16, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'shaco', 17, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'olaf', 18, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'nocturne', 19, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'udyr', 20, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'warwick', 21, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ad', 'sejuani', 22, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'lillia', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'elise', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'evelynn', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'fiddlesticks', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'karthus', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'amumu', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'zac', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'gragas', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'neeko', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'ivern', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'maokai', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'rumble', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'diana', 13, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'ekko', 14, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'skarner', 15, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('jungle', 'ap', 'zaahen', 16, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'katarina', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'zed', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'akali', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'fizz', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'leblanc', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'naafiri', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'talon', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'assassin', 'qiyana', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'ahri', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'malzahar', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'viktor', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'mel', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'syndra', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'ryze', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'xerath', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'twistedfate', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'lux', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'aurora', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'orianna', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'anivia', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'zoe', 13, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'veigar', 14, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'vex', 15, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'cassiopeia', 16, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'taliyah', 17, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'annie', 18, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'aurelionsol', 19, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'hwei', 20, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'lissandra', 21, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'mage', 'azir', 22, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'sylas', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'yone', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'yasuo', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'galio', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'ekko', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'diana', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'irelia', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'sion', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'corki', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'jayce', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'smolder', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'tristana', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'akshan', 13, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('mid', 'bruiser-adc', 'locke', 14, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'caitlyn', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'jinx', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'ezreal', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'jhin', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'xayah', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'missfortune', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'ashe', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'varus', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'kaisa', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'aphelios', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'sivir', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'tristana', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'lucian', 13, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'draven', 14, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'kogmaw', 15, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'twitch', 16, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'vayne', 17, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'samira', 18, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'zeri', 19, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'kalista', 20, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'nilah', 21, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'smolder', 22, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'senna', 23, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'yunara', 24, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'adc', 'corki', 25, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'ziggs', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'seraphine', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'swain', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'velkoz', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'karma', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'syndra', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'veigar', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'hwei', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'yasuo', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'pantheon', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'kennen', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'heimerdinger', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'zyra', 13, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'brand', 14, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'lux', 15, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('adc', 'non-adc', 'azir', 16, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'lulu', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'soraka', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'nami', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'janna', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'yuumi', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'milio', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'seraphine', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'karma', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'sona', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'mom', 'taric', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'blitzcrank', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'thresh', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'leona', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'alistar', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'nautilus', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'rakan', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'braum', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'rell', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'pyke', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'tahmkench', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'poppy', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'dad', 'renata', 12, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'brand', 1, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'zyra', 2, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'velkoz', 3, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'lux', 4, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'morgana', 5, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'senna', 6, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'swain', 7, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'pantheon', 8, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'annie', 9, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'zilean', 10, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'bard', 11, '2026-09-04T00:00:00+09:00', NULL);
INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)
VALUES ('support', 'wtf', 'neeko', 12, '2026-09-04T00:00:00+09:00', NULL);
