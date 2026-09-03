import type { Metadata } from "next";
import Link from "next/link";

import { getChampionBySlug, getPosition } from "@/data/champions";
import { requirePageAdmin } from "@/lib/authGuard";
import { getPendingQueue } from "@/lib/wikiEditStore";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "검토 대기열" };

const DONE_LABEL: Record<string, string> = {
  approved: "승인해 반영했습니다.",
  rejected: "거절했습니다.",
};

/** 대기 중인 편집 제안 목록. 오래된 순 (FR-27). */
export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  await requirePageAdmin();
  const { done } = await searchParams;
  const queue = await getPendingQueue();

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">관리자</p>
      <h1 className={`display ${styles.title}`}>검토 대기열</h1>

      {done && <p className={styles.done}>{DONE_LABEL[done] ?? "처리했습니다."}</p>}

      {queue.length === 0 ? (
        <p className={styles.empty}>대기 중인 제안이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {queue.map((item) => {
            const position = getPosition(item.positionSlug);
            const champion = getChampionBySlug(item.championSlug);
            const sectionLabel = item.meSlug ? (getChampionBySlug(item.meSlug)?.name ?? item.meSlug) : "공통";
            const stale = item.baseRevision !== item.currentRevision;

            return (
              <li key={item.id} className={styles.row}>
                <Link href={`/admin/wiki/review/${item.id}`} className={styles.rowLink}>
                  <div className={styles.rowHead}>
                    <span className="sticker sticker--gum">대기</span>
                    {stale && <span className="sticker">뒤처짐</span>}
                    <span className={styles.target}>
                      {position?.name ?? item.positionSlug} · {champion?.name ?? item.championSlug} ·{" "}
                      {sectionLabel}
                    </span>
                  </div>
                  {item.summary && <p className={styles.summary}>{item.summary}</p>}
                  <p className="mono">{item.authorName ?? "탈퇴 계정"} · {formatDate(item.createdAt)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
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
