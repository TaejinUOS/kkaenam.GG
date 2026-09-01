import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TipForm } from "@/components/matchup/TipForm";
import {
  PATCH,
  allChampions,
  getChampionBySlug,
  getChampionsInPosition,
  getClassificationFor,
  getPosition,
} from "@/data/champions";

type RouteParams = { position: string; champion: string };

export const metadata: Metadata = { title: "상대법 쓰기" };

export default async function WriteTipPage({ params }: { params: Promise<RouteParams> }) {
  const { position, champion } = await params;

  const positionData = getPosition(position);
  const championData = getChampionBySlug(champion);
  const category = getClassificationFor(position, champion);
  if (!positionData || !championData || !category) notFound();

  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <TipForm
        patch={PATCH}
        position={{ slug: positionData.slug, name: positionData.name, code: positionData.code }}
        category={{ slug: category.slug, name: category.name }}
        champion={{
          slug: championData.slug,
          name: championData.name,
          iconUrl: championData.iconUrl,
        }}
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
