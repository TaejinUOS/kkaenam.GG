import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MatchupScreen } from "@/components/matchup/MatchupScreen";
import { PATCH, allChampions, getChampionsInPosition, skillIconUrl } from "@/data/champions";
import { getViewer } from "@/lib/authGuard";
import { eulReul } from "@/lib/josa";
import { type MatchupRouteParams, resolveMatchup } from "@/lib/matchupRoute";
import { resolveWikiLinks } from "@/lib/wikiLink";
import { getWikiView } from "@/lib/wikiStore";

type RouteParams = MatchupRouteParams;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = resolveMatchup(await params);
  if (!resolved) return { title: "찾을 수 없는 상대법" };

  const { positionData, championData } = resolved;
  return {
    title: `${positionData.name} ${championData.name} 상대법`,
    description: `${positionData.name}에서 ${championData.name}${eulReul(championData.name)} 상대하는 방법. 보편 상대법 General과 내 챔피언 전용 상대법 Me를 함께 확인하세요.`,
  };
}

/*
 * 위키는 편집으로 계속 바뀐다. `?me=`가 더 이상 서버 렌더에 관여하지 않게 되면서
 * 이 화면에는 동적으로 만들 요소가 남지 않았으므로, 빌드 시점에 굳지 않도록 못을 박는다.
 */
export const dynamic = "force-dynamic";

export default async function MatchupPage({ params }: { params: Promise<RouteParams> }) {
  const routeParams = await params;
  const resolved = resolveMatchup(routeParams);
  if (!resolved) notFound();

  const { positionData, championData, category } = resolved;

  /*
   * 문서를 통째로 읽는다. 상대법이 목차 하나를 가진 한 문서로 합쳐지면서 `?me=`는
   * 걸러내기가 아니라 문서 안 이동이 되었고, 그래서 서버가 읽는 내용이 선택과
   * 무관해졌다 (PRD FR-12, FR-13, `docs/WIKI_MODEL.md` "문서 구조").
   */
  const [wiki, viewer] = await Promise.all([
    getWikiView(positionData.slug, championData.slug),
    getViewer(),
  ]);

  /*
   * 본문에 적힌 `[[미드/아리]]`를 여기서 미리 풀어 둔다. 해석에 필요한 챔피언
   * 카탈로그와 운영 분류를 클라이언트로 내려보내지 않기 위해서다.
   */
  const wikiLinks = resolveWikiLinks([wiki.general, ...wiki.meSections.map((s) => s.body)]);

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
        wiki={wiki}
        wikiLinks={wikiLinks}
        viewer={viewer}
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
