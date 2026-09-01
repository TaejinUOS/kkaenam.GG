"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { Tip } from "@/data/types";
import { buildQuery } from "@/lib/url";

import { ChampionAside } from "./ChampionAside";
import styles from "./MatchupScreen.module.css";
import { TipBoard } from "./TipBoard";
import type { CategoryView, ChampionOption, ChampionView, PositionView } from "./types";
import { VideoPanel } from "./VideoPanel";

const TABS = [
  { id: "board", label: "게시판" },
  { id: "video", label: "영상" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  patch: string;
  position: PositionView;
  category: CategoryView;
  champion: ChampionView;
  seedTips: Tip[];
  positionChampions: ChampionOption[];
  allChampions: ChampionOption[];
};

export function MatchupScreen({
  patch,
  position,
  category,
  champion,
  seedTips,
  positionChampions,
  allChampions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 탭 상태를 URL에 반영해 새로고침·뒤로 가기 후에도 복원한다 (PRD 5.3.2, FR-10).
  const tabParam = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "board";

  const setParams = useCallback(
    (patchParams: Record<string, string | null>) => {
      router.replace(`${pathname}${buildQuery(searchParams.toString(), patchParams)}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  /** 게시판으로 돌아갔을 때 상태를 유지하기 위해 현재 질의를 그대로 넘긴다 (PRD 5.5). */
  const currentQuery = buildQuery(searchParams.toString(), {});

  return (
    <div className={styles.screen}>
      {/* --------------------------------------------------------- 경로 안내 */}
      <div className="shell">
        <nav className={styles.crumbs} aria-label="현재 위치">
          <Link className={styles.crumbLink} href={`/?position=${position.slug}`}>
            상대법
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className={styles.crumbLink}
            href={`/?position=${position.slug}&category=${category.slug}`}
          >
            {position.name} · {category.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className={styles.crumbCurrent}>{champion.name}</span>

          <Link
            className={`${styles.changeLink} sticker sticker--acid`}
            href={`/?position=${position.slug}&category=${category.slug}`}
          >
            포지션·카테고리 변경
          </Link>
        </nav>
      </div>

      {/* ------------------------------------------------- Aside 5열 + Main 7열 */}
      <div className={`shell ${styles.layout}`}>
        <ChampionAside champion={champion} position={position} patch={patch} />

        <div className={`${styles.main} on-paper`}>
          {/* 종이 인덱스 탭처럼 상단 테두리에 붙인다 (블루프린트 6.3). */}
          <div className={styles.tabs} role="tablist" aria-label="상대법 콘텐츠">
            {TABS.map((item) => {
              const current = item.id === tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={current}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={current ? 0 : -1}
                  className={`${styles.tab} ${current ? styles.tabCurrent : ""}`}
                  onClick={() => setParams({ tab: item.id === "board" ? null : item.id })}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            className={styles.panel}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
          >
            {tab === "board" ? (
              <TipBoard
                position={position}
                champion={champion}
                seedTips={seedTips}
                positionChampions={positionChampions}
                allChampions={allChampions}
                patch={patch}
                currentQuery={currentQuery}
              />
            ) : (
              <VideoPanel champion={champion} position={position} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
