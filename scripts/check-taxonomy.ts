/**
 * 운영 분류 점검 스크립트.
 *
 * `taxonomy.ts`에 적은 한글 챔피언명이 Data Dragon 카탈로그와 일치하는지, 각 카테고리에
 * 챔피언이 실제로 배정되어 있는지, PRD 5.1이 지정한 대표 이미지가 존재하는지 확인한다.
 *
 *   npx tsx scripts/check-taxonomy.ts
 */

import { access } from "node:fs/promises";
import { resolve } from "node:path";

import { PATCH, allChampions, getCategoriesFor, getChampionsIn } from "../src/data/champions";
import { categories, classifications, positions } from "../src/data/taxonomy";

async function main() {
  console.log(`[taxonomy] Data Dragon ${PATCH} / 카탈로그 ${allChampions.length}명`);

  const problems: string[] = [];

  for (const position of positions) {
    const cats = getCategoriesFor(position.slug);
    if (cats.length === 0) problems.push(`${position.name}: 카테고리가 없습니다.`);

    for (const category of cats) {
      const champions = getChampionsIn(position.slug, category.slug);
      if (champions.length === 0) {
        problems.push(`${position.name} / ${category.name}: 배정된 챔피언이 없습니다.`);
      }
      console.log(
        `  ${position.name.padEnd(3)} ${category.name.padEnd(11)} ${String(champions.length).padStart(3)}명  ` +
          champions
            .slice(0, 4)
            .map((c) => c.name)
            .join(", "),
      );
    }
  }

  // PRD 16: 같은 포지션 안에서는 정확히 하나의 카테고리에만 속한다.
  const seen = new Map<string, string>();
  for (const c of classifications) {
    const key = `${c.positionSlug}/${c.championName}`;
    const existing = seen.get(key);
    if (existing) {
      problems.push(`${c.championName}: ${c.positionSlug}에서 ${existing}와 ${c.categorySlug}에 중복 배정되었습니다.`);
    } else {
      seen.set(key, c.categorySlug);
    }
  }

  // PRD 5.1의 대표 이미지가 실제로 존재하는지 확인한다.
  for (const category of categories) {
    const file = resolve(process.cwd(), "public", category.coverImage.replace(/^\//, ""));
    try {
      await access(file);
    } catch {
      problems.push(`${category.name}: 대표 이미지 ${category.coverImage}를 찾을 수 없습니다.`);
    }
  }

  if (problems.length > 0) {
    console.error("\n[taxonomy] 점검 실패:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const total = new Set(classifications.map((c) => c.championName)).size;
  console.log(`\n[taxonomy] 이상 없음. 분류된 챔피언 ${total}명 / 배정 ${classifications.length}건.`);
}

main().catch((error) => {
  console.error("[taxonomy] 점검 중 오류가 발생했습니다.", error);
  process.exit(1);
});
