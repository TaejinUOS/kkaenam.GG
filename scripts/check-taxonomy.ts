/**
 * 운영 분류 **초기 데이터** 점검 스크립트.
 *
 * `taxonomy.ts`의 roster에 적은 한글 챔피언명이 Data Dragon 카탈로그와 일치하는지, 각
 * 카테고리에 챔피언이 배정되어 있는지, PRD 5.1이 지정한 대표 이미지가 존재하는지 본다.
 *
 * **실제 분류는 이제 D1의 `champion_placements`에 있다** (마이그레이션 0004). 이
 * 스크립트가 보는 것은 그 표를 만든 초기 데이터이고, 운영 중 배치는 `/admin/taxonomy`가
 * 검증한다. 카테고리와 대표 이미지 점검은 지금도 유효하다 — 그 둘은 코드에 남아 있다.
 *
 *   npx tsx scripts/check-taxonomy.ts
 */

import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { PATCH, allChampions } from "../src/data/champions";
import { categories, classifications, getCategoriesFor, positions } from "../src/data/taxonomy";

/** roster에서 포지션·카테고리별 명단을 다시 세운다. 예전에는 champions.ts가 해 주던 일이다. */
const byName = new Map(allChampions.map((c) => [c.name, c]));
const rosterOf = (positionSlug: string, categorySlug: string) =>
  classifications
    .filter((c) => c.positionSlug === positionSlug && c.categorySlug === categorySlug && c.visible)
    .sort((a, b) => a.order - b.order)
    .map((c) => byName.get(c.championName))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

async function main() {
  console.log(`[taxonomy] Data Dragon ${PATCH} / 카탈로그 ${allChampions.length}명`);

  const problems: string[] = [];

  for (const position of positions) {
    const cats = getCategoriesFor(position.slug);
    if (cats.length === 0) problems.push(`${position.name}: 카테고리가 없습니다.`);

    for (const category of cats) {
      const champions = rosterOf(position.slug, category.slug);
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

  /*
   * PRD 5.1의 대표 이미지가 실제로 존재하는지 확인한다.
   *
   * `access()`는 Windows에서 대소문자를 구분하지 않아 `Lillia.jpg`와 `lillia.jpg`를
   * 같은 파일로 본다. 그러면 로컬에서는 통과하고 리눅스 배포에서만 404가 난다.
   * 디렉터리 목록의 실제 이름과 정확히 대조해 대소문자 불일치까지 잡는다.
   */
  const imagesDir = resolve(process.cwd(), "public", "images");
  const actualFiles = new Set(await readdir(imagesDir));

  for (const category of categories) {
    const path = category.coverImage;
    if (!path.startsWith("/images/")) {
      problems.push(`${category.name}: 대표 이미지 경로 ${path}는 /images/ 아래에 있어야 합니다.`);
      continue;
    }
    const fileName = path.slice("/images/".length);
    if (!actualFiles.has(fileName)) {
      const caseInsensitive = [...actualFiles].find(
        (f) => f.toLowerCase() === fileName.toLowerCase(),
      );
      problems.push(
        caseInsensitive
          ? `${category.name}: 대표 이미지 ${path}의 대소문자가 실제 파일 ${caseInsensitive}와 다릅니다.`
          : `${category.name}: 대표 이미지 ${path}를 찾을 수 없습니다.`,
      );
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
