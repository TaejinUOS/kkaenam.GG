import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { MergeEditScreen } from "@/components/wiki/MergeEditScreen";
import { getChampionBySlug } from "@/data/champions";
import { PATCH } from "@/data/champions";
import { encodeDocRef } from "@/data/wiki";
import { submitEditAction } from "@/lib/actions/wikiEditActions";
import { getViewer } from "@/lib/authGuard";
import { ro } from "@/lib/josa";
import { type MatchupRouteParams, resolveMatchup } from "@/lib/matchupRoute";
import { getTaxonomy } from "@/lib/taxonomyStore";
import { getWikiView } from "@/lib/wikiStore";

type SearchParams = { section?: string };

/** 편집기는 늘 저장 시점의 실제 문서를 보여줘야 한다. 한 순간도 굳혀 두지 않는다. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "상대법 편집",
  // 편집 화면은 문서의 사본이라 색인될 이유가 없고, 검색 결과에서 문서와 경쟁한다.
  robots: { index: false, follow: false },
};

/**
 * 섹션 지정을 읽는다. `general` 또는 `me:<챔피언 슬러그>`.
 * 문서 안 앵커(`general` / `me-<슬러그>`)와 같은 이름을 쓰므로 주소만 봐도 어디를
 * 고치는지 알 수 있다.
 */
function parseSection(raw: string | undefined): { meSlug: string | null } | null {
  if (!raw || raw === "general") return { meSlug: null };
  if (!raw.startsWith("me:")) return null;
  const slug = raw.slice(3);
  if (!slug || !getChampionBySlug(slug)) return null;
  return { meSlug: slug };
}

/**
 * 상대법 섹션 편집 화면 (FR-24~26).
 *
 * 문서 아래 인라인 상자가 아니라 **주소를 가진 별도 화면**이다. 좌우로 넓게 벌려
 * 지금 문서와 고친 글을 나란히 놓으려면 문서 폭 안에 들어갈 수가 없다.
 */
export default async function EditSectionPage({
  params,
  searchParams,
}: {
  params: Promise<MatchupRouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const routeParams = await params;
  const resolved = resolveMatchup(routeParams, await getTaxonomy());
  if (!resolved) notFound();

  const { section } = await searchParams;
  const parsed = parseSection(section);
  if (!parsed) notFound();

  const { championData } = resolved;
  const { meSlug } = parsed;

  const editHref = `/matchup/${championData.slug}/edit?section=${
    meSlug ? `me:${meSlug}` : "general"
  }`;

  /*
   * 편집은 로그인해야 한다. 로그인 뒤 이 화면으로 되돌아오게 해서, 쓰려던 사람이
   * 다시 문서를 찾아 들어오지 않아도 되게 한다 (PRD 흐름 B·C).
   */
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?callbackUrl=${encodeURIComponent(editHref)}`);

  const wiki = await getWikiView(championData.slug);
  const currentBody = meSlug
    ? (wiki.meSections.find((s) => s.championSlug === meSlug)?.body ?? "")
    : wiki.general;

  const meName = meSlug ? (getChampionBySlug(meSlug)?.name ?? meSlug) : null;
  const sectionTitle = meName ? `${meName}${ro(meName)} 상대할 때` : "공통 상대법";

  /*
   * 돌아갈 곳은 문서의 그 제목 자리다. `?me=`까지 실어 보내야 돌아간 화면이 고친
   * 섹션을 고른 상태로 열린다 — 편집 전에 보고 있던 그 화면이다.
   */
  const returnHref = meSlug
    ? `/matchup/${championData.slug}?me=${meSlug}#me-${meSlug}`
    : `/matchup/${championData.slug}#general`;

  return (
    <MergeEditScreen
      action={submitEditAction}
      hidden={{
        doc: encodeDocRef({ kind: "matchup", championSlug: championData.slug }),
        patch: PATCH,
        ...(meSlug ? { meSlug } : {}),
      }}
      kicker={`${championData.name} 상대법 편집`}
      sectionTitle={sectionTitle}
      currentBody={currentBody}
      isAdmin={viewer.role === "admin"}
      returnHref={returnHref}
    />
  );
}
