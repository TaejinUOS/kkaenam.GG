import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocHistoryView } from "@/components/wiki/DocHistoryView";
import { getViewer } from "@/lib/authGuard";
import { listDocHistory } from "@/lib/wikiEditStore";
import { titleKey } from "@/lib/wikiTitle";
import { getArticleView } from "@/lib/wikiStore";

type RouteParams = { title: string };

export const dynamic = "force-dynamic";

function decodeTitle(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const title = decodeTitle((await params).title);
  const article = await getArticleView(titleKey(title));
  if (!article) return { title: "찾을 수 없는 문서 역사" };
  return { title: `${article.title} 문서 역사` };
}

/** 일반 문서의 역사 (FR-29). 공개 화면 — 되돌리기만 관리자 전용 (FR-30). */
export default async function ArticleHistoryPage({ params }: { params: Promise<RouteParams> }) {
  const title = decodeTitle((await params).title);
  const article = await getArticleView(titleKey(title));
  /* 승인 전 문서에는 아직 역사가 없다. 첫 본문이 검토 대기열에 있을 뿐이다. */
  if (!article || article.status !== "published") notFound();

  const [history, viewer] = await Promise.all([
    listDocHistory({ kind: "article", titleKey: article.titleKey }),
    getViewer(),
  ]);

  return (
    <DocHistoryView
      target={{
        kind: "article",
        title: article.title,
        titleKey: article.titleKey,
        status: article.status,
      }}
      history={history}
      isAdmin={viewer?.role === "admin"}
    />
  );
}
