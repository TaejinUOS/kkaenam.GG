import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TipDetail } from "@/components/matchup/TipDetail";
import {
  allChampions,
  getChampionBySlug,
  getClassificationFor,
  getPosition,
} from "@/data/champions";
import { getSeedTipsFor } from "@/data/tips";

type RouteParams = { position: string; champion: string; tipId: string };

export default async function TipDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { position, champion, tipId } = await params;

  const positionData = getPosition(position);
  const championData = getChampionBySlug(champion);
  const category = getClassificationFor(position, champion);
  if (!positionData || !championData || !category) notFound();

  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <TipDetail
        tipId={tipId}
        position={{ slug: positionData.slug, name: positionData.name, code: positionData.code }}
        category={{ slug: category.slug, name: category.name }}
        champion={{
          slug: championData.slug,
          name: championData.name,
          iconUrl: championData.iconUrl,
        }}
        seedTips={getSeedTipsFor(positionData.slug, championData.slug)}
        allChampions={allChampions.map((c) => ({
          slug: c.slug,
          name: c.name,
          iconUrl: c.iconUrl,
        }))}
      />
    </Suspense>
  );
}
