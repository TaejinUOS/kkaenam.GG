"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { WikiLinkMap } from "@/lib/wikiLink";
import type { WikiView } from "@/lib/wikiStore";
import { buildQuery } from "@/lib/url";

import { ChampionAside } from "./ChampionAside";
import styles from "./MatchupScreen.module.css";
import type { CategoryView, ChampionOption, ChampionView, PositionView } from "./types";
import { VideoPanel } from "./VideoPanel";
import { WikiPanel } from "./WikiPanel";

const TABS = [
  { id: "board", label: "상대법" },
  { id: "video", label: "영상" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Viewer = { id: string; name: string; role: "member" | "admin" } | null;

type Props = {
  patch: string;
  position: PositionView;
  category: CategoryView;
  champion: ChampionView;
  /** 서버가 D1에서 읽어 온 위키 문서. */
  wiki: WikiView;
  wikiLinks: WikiLinkMap;
  positionChampions: ChampionOption[];
  allChampions: ChampionOption[];
  viewer: Viewer;
};

export function MatchupScreen({
  patch,
  position,
  category,
  champion,
  wiki,
  wikiLinks,
  positionChampions,
  allChampions,
  viewer,
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

      {/* ------------------------------------------ 좁은 Aside + 넓은 Wiki Main */}
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
              <WikiPanel
                position={position}
                champion={champion}
                patch={patch}
                wiki={wiki}
                wikiLinks={wikiLinks}
                positionChampions={positionChampions}
                allChampions={allChampions}
                viewer={viewer}
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
