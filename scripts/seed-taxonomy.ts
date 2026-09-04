/**
 * `src/data/taxonomy.ts`의 운영 분류를 D1 마이그레이션 SQL로 옮긴다.
 *
 *   npx tsx scripts/seed-taxonomy.ts
 *
 * 결과는 `migrations/0004_champion_placements.sql`이다. 분류가 코드를 떠나 표로
 * 옮겨 가는 것은 **패치마다 바뀌는 값이기 때문이다** — 챔피언 하나를 미드에 올리려고
 * 배포를 하는 것은 운영이 아니다 (PRD 3.1-6).
 *
 * 이 스크립트는 한 번만 쓰인다. 이후의 분류 변경은 `/admin/taxonomy`에서 한다.
 * 다시 돌리면 마이그레이션 파일을 덮어쓰므로, 이미 적용한 뒤에는 돌리지 않는다.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { allChampions } from "../src/data/champions";
import { classifications } from "../src/data/taxonomy";

const MIGRATED_AT = "2026-09-04T00:00:00+09:00";

const slugByName = new Map(allChampions.map((c) => [c.name, c.slug]));

function sql(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

const lines: string[] = [
  "-- 챔피언 배치 — 어느 포지션의 어느 카테고리에 속하는가.",
  "--",
  "-- 분류는 패치마다 바뀐다. 원래 미드에 없던 챔피언이 올라오고, 있던 챔피언이 내려간다.",
  "-- 그때마다 배포를 하는 것은 운영이 아니므로(PRD 3.1-6) 이 값을 코드에서 표로 옮긴다.",
  "-- 이후 변경은 `/admin/taxonomy`에서 하고, `src/data/taxonomy.ts`의 roster는 이 초기",
  "-- 데이터를 만든 근거로만 남는다.",
  "--",
  "-- 문서는 이 표에 딸리지 않는다. 매치업 문서의 식별자는 챔피언이므로(마이그레이션 0003)",
  "-- 배치를 아무리 고쳐도 이미 쓰인 글은 그대로 있다. 그게 0003을 먼저 한 이유다.",
  "",
  "CREATE TABLE champion_placements (",
  "  position_slug TEXT NOT NULL,",
  "  category_slug TEXT NOT NULL,",
  "  champion_slug TEXT NOT NULL,",
  "  -- 카테고리 안에서의 순서. Contact Sheet가 이 순서로 늘어놓는다.",
  "  sort_order    INTEGER NOT NULL DEFAULT 0,",
  "  updated_at    TEXT NOT NULL,",
  "  updated_by    TEXT REFERENCES users(id),",
  "  -- 한 포지션에서 한 챔피언은 카테고리 하나에만 속한다.",
  "  PRIMARY KEY (position_slug, champion_slug)",
  ");",
  "",
  "-- 포지션·카테고리별 조회가 이 표의 유일한 읽기 패턴이다.",
  "CREATE INDEX idx_placements_category ON champion_placements (position_slug, category_slug, sort_order);",
  "",
  "-- 아래는 `src/data/taxonomy.ts`의 roster를 그대로 옮긴 것이다.",
  "",
];

let count = 0;
const unresolved: string[] = [];

for (const c of classifications) {
  const slug = slugByName.get(c.championName);
  if (!slug) {
    unresolved.push(c.championName);
    continue;
  }
  lines.push(
    `INSERT INTO champion_placements (position_slug, category_slug, champion_slug, sort_order, updated_at, updated_by)`,
    `VALUES (${sql(c.positionSlug)}, ${sql(c.categorySlug)}, ${sql(slug)}, ${c.order}, ${sql(MIGRATED_AT)}, NULL);`,
  );
  count += 1;
}

if (unresolved.length > 0) {
  console.error(`카탈로그에 없는 챔피언: ${unresolved.join(", ")}`);
  process.exit(1);
}

const out = resolve(process.cwd(), "migrations/0004_champion_placements.sql");
writeFileSync(out, `${lines.join("\n")}\n`, "utf8");
console.log(`배치 ${count}개를 담았습니다.`);
console.log(`생성: ${out}`);
