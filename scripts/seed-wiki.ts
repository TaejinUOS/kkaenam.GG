/**
 * 시드 Tip을 위키 문서 초안으로 옮기는 SQL을 만든다 (일회성).
 *
 * `docs/WIKI_MODEL.md`의 "시드 Tip 이관"을 그대로 구현한다.
 *   - Tip의 general      → 문서의 공통 섹션
 *   - Tip의 meBlocks[]   → 해당 챔피언의 Me 섹션
 *   - 같은 매치업의 Tip이 여럿이면 이어 붙인다
 *   - 이관분은 승인된 편집(리비전 1)으로 남기고 제안자는 시스템 계정으로 기록한다
 *
 * 바로 DB에 쓰지 않고 SQL 파일로 뽑는 이유는, 반영 전에 사람이 한 번 읽어 보기
 * 위해서다. 시드 Tip은 제목이 본문과 분리돼 있는데 위키 문서에는 제목 칸이 없어,
 * 이어 붙이는 과정에서 사람의 확인이 필요하다.
 *
 *   npm run wiki:seed              → seeds/wiki-from-tips.sql 생성
 *   (내용 확인 후)
 *   npx wrangler d1 execute kkaenam-gg --local --file seeds/wiki-from-tips.sql
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { seedTips } from "../src/data/tips";
import { SYSTEM_USER_ID } from "../src/data/wiki";
import type { Tip } from "../src/data/types";

/*
 * migrations/ 아래에 두면 안 된다. wrangler가 그 디렉터리의 .sql을 전부 마이그레이션으로
 * 취급해, 나중에 `d1 migrations apply`를 돌릴 때 시드가 다시 실행되고 중복 삽입이 난다.
 */
const OUT = join(process.cwd(), "seeds", "wiki-from-tips.sql");

/** 이관 시각. 실행할 때마다 값이 바뀌면 diff가 지저분해지므로 고정한다. */
const MIGRATED_AT = "2026-09-02T00:00:00+09:00";

/** SQL 문자열 리터럴. D1에 값을 넘길 때 작은따옴표만 이스케이프하면 된다. */
function sql(value: string | null): string {
  if (value === null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * 여러 Tip의 본문을 한 섹션으로 잇는다.
 * Tip 제목은 위키에 대응하는 칸이 없어 본문 앞 줄로 남긴다. 정보를 버리지 않기 위해서다.
 */
function joinBodies(parts: { heading?: string; body: string }[]): string {
  return parts
    .map((p) => (p.heading ? `${p.heading}\n\n${p.body}` : p.body))
    .join("\n\n");
}

type DocKey = string;
const docs = new Map<
  DocKey,
  {
    positionSlug: string;
    championSlug: string;
    patch: string;
    generals: { heading: string; body: string }[];
    /** 내 챔피언 슬러그 → 본문 조각들 */
    meBodies: Map<string, string[]>;
  }
>();

for (const tip of seedTips as Tip[]) {
  const key = `${tip.positionSlug}/${tip.championSlug}`;
  let doc = docs.get(key);
  if (!doc) {
    doc = {
      positionSlug: tip.positionSlug,
      championSlug: tip.championSlug,
      patch: tip.patch,
      generals: [],
      meBodies: new Map(),
    };
    docs.set(key, doc);
  }

  doc.generals.push({ heading: tip.title, body: tip.general });

  for (const block of tip.meBlocks) {
    const list = doc.meBodies.get(block.championSlug) ?? [];
    list.push(block.body);
    doc.meBodies.set(block.championSlug, list);
  }
}

const lines: string[] = [
  "-- 시드 Tip을 위키 문서로 옮긴 결과. scripts/seed-wiki.ts가 만든다.",
  "-- 직접 고치지 말고 스크립트를 고쳐 다시 생성한다.",
  "",
  "-- 이관분의 작성자로 쓰는 시스템 계정.",
  `INSERT OR IGNORE INTO users (id, provider, provider_id, name, email, role, created_at)`,
  `VALUES (${sql(SYSTEM_USER_ID)}, 'system', 'seed', '깨남.GG', NULL, 'admin', ${sql(MIGRATED_AT)});`,
  "",
];

let docCount = 0;
let sectionCount = 0;
let editCount = 0;

for (const [key, doc] of [...docs.entries()].sort()) {
  const docId = `doc-${doc.positionSlug}-${doc.championSlug}`;
  const general = joinBodies(doc.generals);

  lines.push(`-- ${key} — Tip ${doc.generals.length}개, Me 섹션 ${doc.meBodies.size}개`);
  lines.push(
    `INSERT INTO wiki_docs (id, position_slug, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)`,
    `VALUES (${sql(docId)}, ${sql(doc.positionSlug)}, ${sql(doc.championSlug)}, ${sql(general)}, 1, ${sql(doc.patch)}, 'guarded', ${sql(MIGRATED_AT)}, ${sql(MIGRATED_AT)}, ${sql(SYSTEM_USER_ID)});`,
  );
  docCount += 1;

  // 공통 섹션의 이관을 리비전 1로 남긴다.
  lines.push(
    `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)`,
    `VALUES (${sql(`edit-${docId}-general`)}, ${sql(docId)}, NULL, 0, ${sql(general)}, '시드 Tip 이관', 'accepted', ${sql(SYSTEM_USER_ID)}, ${sql(MIGRATED_AT)}, 'admin', NULL, NULL, NULL, 1);`,
  );
  editCount += 1;

  for (const [meSlug, bodies] of [...doc.meBodies.entries()].sort()) {
    const body = joinBodies(bodies.map((b) => ({ body: b })));
    lines.push(
      `INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)`,
      `VALUES (${sql(docId)}, ${sql(meSlug)}, ${sql(body)}, ${sql(MIGRATED_AT)}, ${sql(SYSTEM_USER_ID)});`,
      `INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)`,
      `VALUES (${sql(`edit-${docId}-me-${meSlug}`)}, ${sql(docId)}, ${sql(meSlug)}, 0, ${sql(body)}, '시드 Tip 이관', 'accepted', ${sql(SYSTEM_USER_ID)}, ${sql(MIGRATED_AT)}, 'admin', NULL, NULL, NULL, 1);`,
    );
    sectionCount += 1;
    editCount += 1;
  }

  lines.push("");
}

writeFileSync(OUT, lines.join("\n"), "utf8");

console.log(`시드 Tip ${seedTips.length}개 → 문서 ${docCount}개`);
console.log(`  Me 섹션 ${sectionCount}개, 편집 기록 ${editCount}개`);
console.log(`\n생성: ${OUT}`);
console.log("내용을 확인한 뒤 반영하세요:");
console.log("  npx wrangler d1 execute kkaenam-gg --local --file seeds/wiki-from-tips.sql");
