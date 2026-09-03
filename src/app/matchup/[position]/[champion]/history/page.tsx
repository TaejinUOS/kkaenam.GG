import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownBody } from "@/components/wiki/MarkdownBody";
import { resolveWikiTitle } from "@/lib/wikiLink";
import { RevertButton } from "@/components/wiki/RevertButton";
import { getChampionBySlug } from "@/data/champions";
import { getViewer } from "@/lib/authGuard";
import { type MatchupRouteParams, resolveMatchup } from "@/lib/matchupRoute";
import { getHistoryEntryBody, listDocHistory } from "@/lib/wikiEditStore";

import styles from "./page.module.css";

const ACCEPTED_VIA_LABEL: Record<string, string> = {
  empty_section: "무검토 게시",
  review: "검토 승인",
  admin: "관리자",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<MatchupRouteParams>;
}): Promise<Metadata> {
  const resolved = resolveMatchup(await params);
  if (!resolved) return { title: "찾을 수 없는 문서 역사" };
  return { title: `${resolved.positionData.name} ${resolved.championData.name} 문서 역사` };
}

/** 문서 역사 열람 (FR-29). 공개 화면 — 로그인 불필요. 되돌리기만 관리자 전용 (FR-30). */
export default async function DocHistoryPage({ params }: { params: Promise<MatchupRouteParams> }) {
  const resolved = resolveMatchup(await params);
  if (!resolved) notFound();
  const { positionData, championData } = resolved;

  const [history, viewer] = await Promise.all([
    listDocHistory(positionData.slug, championData.slug),
    getViewer(),
  ]);

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">문서 역사</p>
      <h1 className={`display ${styles.title}`}>
        {positionData.name} {championData.name} 상대법
      </h1>
      <Link href={`/matchup/${positionData.slug}/${championData.slug}`} className={styles.back}>
        문서로 돌아가기
      </Link>

      {history.length === 0 ? (
        <p className={styles.empty}>아직 반영된 편집이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {history.map((entry) => (
            <li key={entry.id} className={styles.row}>
              <details>
                <summary className={styles.summary}>
                  <span className="mono">r{entry.revision}</span>
                  <span className="sticker">
                    {entry.meSlug ? (getChampionBySlug(entry.meSlug)?.name ?? entry.meSlug) : "공통"}
                  </span>
                  <span className={`sticker ${entry.acceptedVia === "empty_section" ? "sticker--gum" : "sticker--acid"}`}>
                    {ACCEPTED_VIA_LABEL[entry.acceptedVia] ?? entry.acceptedVia}
                  </span>
                  <span>{entry.summary || "(요약 없음)"}</span>
                  <span className="mono">{entry.authorName ?? "탈퇴 계정"} · {formatDate(entry.createdAt)}</span>
                </summary>
                <div className={styles.detailBody}>
                  <HistoryBody editId={entry.id} />
                  {viewer?.role === "admin" && (
                    <RevertButton
                      positionSlug={positionData.slug}
                      championSlug={championData.slug}
                      targetRevision={entry.revision}
                    />
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function HistoryBody({ editId }: { editId: string }) {
  const body = await getHistoryEntryBody(editId);
  return (
    <div className={styles.body}>
      <MarkdownBody text={body || "(비어 있음)"} resolveLink={resolveWikiTitle} />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
