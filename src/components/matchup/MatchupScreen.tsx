"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { WikiLinkMap } from "@/lib/wikiLink";
import type { WikiView } from "@/lib/wikiStore";
import { buildQuery } from "@/lib/url";

import { ChampionAside } from "./ChampionAside";
import styles from "./MatchupScreen.module.css";
import type { ChampionOption, ChampionView, PlacementView } from "./types";
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
  /** 이 챔피언이 지금 놓인 자리 전부. 비어 있지 않다 (`resolveMatchup`이 보장한다). */
  placements: PlacementView[];
  champion: ChampionView;
  /** 서버가 D1에서 읽어 온 위키 문서. */
  wiki: WikiView;
  wikiLinks: WikiLinkMap;
  /** 이 챔피언이 놓인 포지션들의 챔피언을 합친 것. Me 콤보박스의 기본 검색 대상. */
  nearbyChampions: ChampionOption[];
  allChampions: ChampionOption[];
  viewer: Viewer;
};

export function MatchupScreen({
  patch,
  placements,
  champion,
  wiki,
  wikiLinks,
  nearbyChampions,
  allChampions,
  viewer,
}: Props) {
  /*
   * 여러 자리에 놓인 챔피언은 그 전부를 보여 준다. 럭스 문서를 열었을 때
   * "미드 · 원딜 · 서폿"이 보이는 편이, 셋 중 하나만 고르는 것보다 정확하다.
   */
  const positionLabel = placements.map((p) => p.position.name).join(" · ");
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
          <Link className={styles.crumbLink} href={`/?position=${placements[0].position.slug}`}>
            상대법
          </Link>
          <span aria-hidden="true">/</span>
          {/*
            자리마다 링크를 하나씩 둔다. 문서는 하나지만 들어온 길은 여럿일 수 있어,
            "이 챔피언이 어디에 속하는가"를 여기서 한 번에 보여 준다.
          */}
          {placements.map(({ position, category }, index) => (
            <span key={`${position.slug}/${category.slug}`}>
              {index > 0 && <span aria-hidden="true"> · </span>}
              <Link
                className={styles.crumbLink}
                href={`/?position=${position.slug}&category=${category.slug}`}
              >
                {position.name} · {category.name}
              </Link>
            </span>
          ))}
          <span aria-hidden="true">/</span>
          <span className={styles.crumbCurrent}>{champion.name}</span>

          <Link
            className={`${styles.changeLink} sticker sticker--acid`}
            href={`/?position=${placements[0].position.slug}&category=${placements[0].category.slug}`}
          >
            포지션·카테고리 변경
          </Link>
        </nav>
      </div>

      {/* ------------------------------------------ 좁은 Aside + 넓은 Wiki Main */}
      <div className={`shell ${styles.layout}`}>
        <ChampionAside champion={champion} positionLabel={positionLabel} patch={patch} />

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
                positionLabel={positionLabel}
                champion={champion}
                wiki={wiki}
                wikiLinks={wikiLinks}
                nearbyChampions={nearbyChampions}
                allChampions={allChampions}
                viewer={viewer}
              />
            ) : (
              <VideoPanel champion={champion} positionLabel={positionLabel} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
