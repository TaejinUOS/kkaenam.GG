/**
 * Riot Data Dragon 동기화 스크립트.
 *
 * PRD 8 "챔피언 / 스킬" 데이터 요구사항과 14장 위험 대응("Data Dragon 버전을 저장하고
 * 패치 갱신 절차와 마지막 갱신일을 표시한다")에 따라, 패치 버전을 고정한 상태로
 * 챔피언 기본 정보와 Q/W/E/R 스킬을 내려받아 `src/data/generated/champions.json`에 저장한다.
 *
 *   npm run data:sync              # DDRAGON_PATCH 기본값으로 동기화
 *   DDRAGON_PATCH=16.17.1 npm run data:sync
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PATCH = process.env.DDRAGON_PATCH ?? "16.17.1";
const LOCALE = "ko_KR";
const CDN = "https://ddragon.leagueoflegends.com/cdn";
const CONCURRENCY = 8;

const OUT_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/generated/champions.json",
);

/** 우리가 노출하는 스킬 슬롯. PRD 16 전제에 따라 패시브는 MVP 범위에서 제외한다. */
const SLOTS = ["Q", "W", "E", "R"] as const;

type DDragonSpell = {
  id: string;
  name: string;
  description: string;
  cooldownBurn: string;
  costBurn: string;
  costType: string;
  rangeBurn: string;
  image: { full: string };
};

type DDragonChampion = {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  image: { full: string };
  spells: DDragonSpell[];
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return (await res.json()) as T;
}

/** Data Dragon 설명문에 남아 있는 인라인 태그를 평문으로 정리한다. */
function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "9/8/7/6/5" 형태의 레벨별 수치를 그대로 유지하되 빈 값은 null로 정규화한다. */
function burn(value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned || cleaned === "0") return null;
  return cleaned;
}

/**
 * `costType`은 단위 이름이 아니라 "{{ cost }}"처럼 치환되지 않은 표시용 템플릿을 담고 있다.
 * 692개 스킬 중 566개가 여기에 해당해, 그대로 두면 스킬 쪽지에 자리표시자가 그대로 노출된다.
 * 자리표시자와 그로 인해 비어 버린 괄호를 지우고, 남은 실제 단위 표기만 살린다.
 */
function costType(raw: string): string {
  return stripTags(raw ?? "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  console.log(`[ddragon] 패치 ${PATCH} / 로케일 ${LOCALE} 동기화를 시작합니다.`);

  const list = await getJson<{ data: Record<string, { id: string }> }>(
    `${CDN}/${PATCH}/data/${LOCALE}/champion.json`,
  );
  const ids = Object.values(list.data)
    .map((c) => c.id)
    .sort();
  console.log(`[ddragon] 챔피언 ${ids.length}명의 스킬 정보를 내려받습니다.`);

  let done = 0;
  const champions = await mapWithConcurrency(ids, CONCURRENCY, async (id) => {
    const detail = await getJson<{ data: Record<string, DDragonChampion> }>(
      `${CDN}/${PATCH}/data/${LOCALE}/champion/${id}.json`,
    );
    const champion = detail.data[id];

    done += 1;
    if (done % 40 === 0) console.log(`[ddragon]   ${done}/${ids.length}`);

    return {
      id: champion.id,
      slug: champion.id.toLowerCase(),
      key: champion.key,
      name: champion.name,
      title: champion.title,
      tags: champion.tags,
      iconFile: champion.image.full,
      spells: champion.spells.slice(0, 4).map((spell, index) => ({
        slot: SLOTS[index],
        id: spell.id,
        name: spell.name,
        description: stripTags(spell.description),
        cooldown: burn(spell.cooldownBurn),
        cost: burn(spell.costBurn),
        costType: costType(spell.costType),
        range: burn(spell.rangeBurn),
        iconFile: spell.image.full,
      })),
    };
  });

  const payload = {
    patch: PATCH,
    locale: LOCALE,
    syncedAt: new Date().toISOString(),
    champions,
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`[ddragon] ${champions.length}명을 ${OUT_FILE}에 저장했습니다.`);
}

main().catch((error) => {
  console.error("[ddragon] 동기화에 실패했습니다.", error);
  process.exit(1);
});
