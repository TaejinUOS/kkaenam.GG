import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MatchupScreen } from "@/components/matchup/MatchupScreen";
import {
  PATCH,
  allChampions,
  getChampionBySlug,
  getChampionsInPosition,
  getClassificationFor,
  getPosition,
  skillIconUrl,
} from "@/data/champions";
import { getSeedTipsFor } from "@/data/tips";

type RouteParams = { position: string; champion: string };

/** 라우트 파라미터를 검증해 화면에 필요한 데이터로 바꾼다. 조합이 틀리면 undefined. */
function resolve({ position, champion }: RouteParams) {
  const positionData = getPosition(position);
  const championData = getChampionBySlug(champion);
  if (!positionData || !championData) return undefined;

  // PRD FR-07: 다른 포지션의 콘텐츠가 섞이지 않도록 분류에 없는 조합은 허용하지 않는다.
  const category = getClassificationFor(position, champion);
  if (!category) return undefined;

  return { positionData, championData, category };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = resolve(await params);
  if (!resolved) return { title: "찾을 수 없는 상대법" };

  const { positionData, championData } = resolved;
  return {
    title: `${positionData.name} ${championData.name} 상대법`,
    description: `${positionData.name}에서 ${championData.name}를 상대하는 방법. 보편 상대법 General과 내 챔피언 전용 상대법 Me를 함께 확인하세요.`,
  };
}

export default async function MatchupPage({ params }: { params: Promise<RouteParams> }) {
  const routeParams = await params;
  const resolved = resolve(routeParams);
  if (!resolved) notFound();

  const { positionData, championData, category } = resolved;

  return (
    <Suspense fallback={<div style={{ minHeight: "70vh" }} />}>
      <MatchupScreen
        patch={PATCH}
        position={{
          slug: positionData.slug,
          name: positionData.name,
          code: positionData.code,
        }}
        category={{ slug: category.slug, name: category.name }}
        champion={{
          slug: championData.slug,
          name: championData.name,
          title: championData.title,
          iconUrl: championData.iconUrl,
          illustrationUrl: championData.illustrationUrl,
          focus: championData.focus,
          spells: championData.spells.map((spell) => ({
            slot: spell.slot,
            name: spell.name,
            description: spell.description,
            cooldown: spell.cooldown,
            cost: spell.cost,
            costType: spell.costType,
            range: spell.range,
            iconUrl: skillIconUrl(spell.iconFile),
          })),
        }}
        seedTips={getSeedTipsFor(positionData.slug, championData.slug)}
        /* Me 콤보박스는 현재 포지션의 챔피언을 기본 검색 대상으로 한다 (PRD 5.3.3). */
        positionChampions={getChampionsInPosition(positionData.slug).map((c) => ({
          slug: c.slug,
          name: c.name,
          iconUrl: c.iconUrl,
        }))}
        allChampions={allChampions.map((c) => ({
          slug: c.slug,
          name: c.name,
          iconUrl: c.iconUrl,
        }))}
      />
    </Suspense>
  );
}
