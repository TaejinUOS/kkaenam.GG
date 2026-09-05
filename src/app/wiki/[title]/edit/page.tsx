import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { MergeEditScreen } from "@/components/wiki/MergeEditScreen";
import { PATCH } from "@/data/champions";
import { encodeDocRef } from "@/data/wiki";
import { submitEditAction } from "@/lib/actions/wikiEditActions";
import { getViewer } from "@/lib/authGuard";
import { articleHref, titleKey } from "@/lib/wikiTitle";
import { getArticleView } from "@/lib/wikiStore";

type RouteParams = { title: string };

/** 편집기는 늘 저장 시점의 실제 문서를 보여줘야 한다. 한 순간도 굳혀 두지 않는다. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "문서 편집",
  // 편집 화면은 문서의 사본이라 색인될 이유가 없고, 검색 결과에서 문서와 경쟁한다.
  robots: { index: false, follow: false },
};

function decodeTitle(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * 일반 문서 본문 편집.
 *
 * 매치업 섹션 편집과 **같은 화면**을 쓴다. 편집 단위가 섹션이고 즉시반영·검토 판정이
 * 섹션마다 도는 것은 문서 종류와 무관하기 때문이다 — 다른 것은 어느 문서를 가리키느냐
 * 하나뿐이라, 그 값만 폼에 실어 보낸다.
 *
 * 이름 붙은 섹션은 3단계에서 붙는다. 지금 일반 문서는 본문 하나뿐이라 `?section=`이 없다.
 */
export default async function ArticleEditPage({ params }: { params: Promise<RouteParams> }) {
  const title = decodeTitle((await params).title);
  const key = titleKey(title);
  const editHref = `${articleHref(title)}/edit`;

  /*
   * 편집은 로그인해야 한다. 로그인 뒤 이 화면으로 되돌아오게 해서, 쓰려던 사람이
   * 다시 문서를 찾아 들어오지 않아도 되게 한다 (PRD 흐름 B·C).
   */
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?callbackUrl=${encodeURIComponent(editHref)}`);

  const article = await getArticleView(key);
  /* 승인 전 문서는 고칠 수 없다. 그 본문은 아직 검토 대기열에 있다. */
  if (!article || article.status !== "published") notFound();

  return (
    <MergeEditScreen
      action={submitEditAction}
      hidden={{ doc: encodeDocRef({ kind: "article", titleKey: article.titleKey }), patch: PATCH }}
      kicker={`${article.title} 편집`}
      sectionTitle="본문"
      currentBody={article.body}
      isAdmin={viewer.role === "admin"}
      returnHref={`${articleHref(article.title)}#general`}
    />
  );
}
