import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MergeEditScreen } from "@/components/wiki/MergeEditScreen";
import { PATCH } from "@/data/champions";
import { proposeArticleAction } from "@/lib/actions/wikiEditActions";
import { getViewer } from "@/lib/authGuard";
import { MAX_TITLE_LENGTH } from "@/lib/wikiTitle";

type SearchParams = { title?: string };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "새 문서 제안",
  // 아직 문서가 아닌 화면이다. 색인될 이유가 없다.
  robots: { index: false, follow: false },
};

/**
 * 새 일반 문서 제안 (`docs/WIKI_EXPANSION.md` 2단계).
 *
 * 편집 화면을 그대로 쓴다. 왼쪽이 비어 있고 오른쪽이 전부 초록인 상태 — 빈 섹션을
 * 채울 때와 똑같은 화면이고, 위에 제목 칸이 하나 더 붙는다. 다만 안내는 다르다:
 * 초록뿐이어도 **문서 생성은 언제나 운영자 승인을 거친다.**
 *
 * 빨간 링크가 이 화면으로 데려온다 (`/wiki/<이름>` → `이 이름으로 쓰기`). 그때
 * `?title=`로 이름이 미리 채워져, 눌러 온 사람이 이름을 다시 적지 않아도 된다.
 */
export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { title } = await searchParams;
  const suggested = (title ?? "").slice(0, MAX_TITLE_LENGTH);

  const here = `/wiki/new${suggested ? `?title=${encodeURIComponent(suggested)}` : ""}`;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?callbackUrl=${encodeURIComponent(here)}`);

  return (
    <MergeEditScreen
      action={proposeArticleAction}
      hidden={{ patch: PATCH }}
      kicker="새 문서"
      sectionTitle="문서 만들기"
      currentBody=""
      isAdmin={viewer.role === "admin"}
      returnHref="/wiki"
      create={{ defaultTitle: suggested }}
    />
  );
}
