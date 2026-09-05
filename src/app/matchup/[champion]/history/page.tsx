import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocHistoryView } from "@/components/wiki/DocHistoryView";
import { getViewer } from "@/lib/authGuard";
import { type MatchupRouteParams, resolveMatchup } from "@/lib/matchupRoute";
import { getTaxonomy } from "@/lib/taxonomyStore";
import { listDocHistory } from "@/lib/wikiEditStore";

export async function generateMetadata({
  params,
}: {
  params: Promise<MatchupRouteParams>;
}): Promise<Metadata> {
  const resolved = resolveMatchup(await params, await getTaxonomy());
  if (!resolved) return { title: "찾을 수 없는 문서 역사" };
  return { title: `${resolved.championData.name} 상대법 문서 역사` };
}

/** 문서 역사 열람 (FR-29). 공개 화면 — 로그인 불필요. 되돌리기만 관리자 전용 (FR-30). */
export default async function DocHistoryPage({ params }: { params: Promise<MatchupRouteParams> }) {
  const resolved = resolveMatchup(await params, await getTaxonomy());
  if (!resolved) notFound();
  const { championData } = resolved;

  const [history, viewer] = await Promise.all([
    listDocHistory({ kind: "matchup", championSlug: championData.slug }),
    getViewer(),
  ]);

  return (
    <DocHistoryView
      target={{ kind: "matchup", championSlug: championData.slug }}
      history={history}
      isAdmin={viewer?.role === "admin"}
    />
  );
}
