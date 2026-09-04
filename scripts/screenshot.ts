/**
 * 화면 캡처 스크립트.
 *
 * 브라우저 확장으로는 창 크기를 뷰포트에 반영하지 못해 모바일 화면을 확인할 수 없었다.
 * Playwright로 정확한 뷰포트를 지정해 주요 화면을 한 번에 캡처한다.
 * 설치된 Chrome을 그대로 쓰므로(`channel: "chrome"`) 브라우저를 따로 내려받지 않는다.
 *
 *   npm run dev                       # 다른 터미널에서 먼저 띄운다
 *   npm run shots                     # 전체 캡처
 *   npm run shots -- mobile           # 특정 뷰포트만
 *   BASE_URL=http://localhost:3001 npm run shots
 *
 * 결과는 `.screenshots/`에 저장되며 git에는 올리지 않는다.
 */

import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, type Browser } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = resolve(process.cwd(), ".screenshots");

/** 블루프린트 8장의 반응형 구간에 맞춘 뷰포트. */
const VIEWPORTS = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const PAGES = [
  { name: "01-select-mid", path: "/?position=mid" },
  { name: "02-select-support", path: "/?position=support" },
  { name: "03-select-adc", path: "/?position=adc" },
  { name: "04-contact-sheet", path: "/?position=mid&category=assassin" },
  { name: "05-matchup", path: "/matchup/mid/ahri" },
  { name: "06-matchup-me", path: "/matchup/mid/ahri?me=twistedfate" },
  { name: "07-tip-detail", path: "/matchup/mid/ahri/tips/tip-ahri-1?me=twistedfate" },
  { name: "08-write", path: "/matchup/mid/ahri/write" },
  { name: "09-coming-soon", path: "/records" },
  { name: "10-wiki-index", path: "/wiki" },
  { name: "11-wiki-portal", path: `/wiki?${new URLSearchParams({ 분류: "라인전" })}` },
  { name: "12-wiki-recent", path: "/wiki/recent" },
  { name: "13-wiki-wanted", path: "/wiki/wanted" },
] as const;

async function capture(browser: Browser, viewport: (typeof VIEWPORTS)[number]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
    // 모바일 폭에서는 터치 환경으로 두어 호버 전용 스타일이 걸리지 않게 한다.
    hasTouch: viewport.name === "mobile",
    isMobile: viewport.name === "mobile",
    locale: "ko-KR",
  });
  const page = await context.newPage();

  for (const target of PAGES) {
    await page.goto(`${BASE_URL}${target.path}`, { waitUntil: "networkidle" });
    // 웹폰트와 외부 이미지가 모두 그려진 뒤에 찍는다.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);

    await page.screenshot({
      path: resolve(OUT_DIR, `${viewport.name}--${target.name}.png`),
      fullPage: true,
    });
    console.log(`  ${viewport.name.padEnd(7)} ${target.name}`);
  }

  await context.close();
}

async function main() {
  const only = process.argv.slice(2);
  const viewports = only.length
    ? VIEWPORTS.filter((v) => only.includes(v.name))
    : [...VIEWPORTS];

  if (viewports.length === 0) {
    console.error(`뷰포트 이름이 올바르지 않습니다. 사용 가능: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
    process.exit(1);
  }

  const res = await fetch(BASE_URL).catch(() => null);
  if (!res?.ok) {
    console.error(`${BASE_URL}에 연결하지 못했습니다. 먼저 \`npm run dev\`를 실행하세요.`);
    process.exit(1);
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome" });
  console.log(`[shots] ${BASE_URL} → .screenshots/`);
  for (const viewport of viewports) {
    await capture(browser, viewport);
  }
  await browser.close();

  console.log(`[shots] ${viewports.length * PAGES.length}장을 저장했습니다.`);
}

main().catch((error) => {
  console.error("[shots] 캡처에 실패했습니다.", error);
  process.exit(1);
});
