import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewMergeForm } from "@/components/admin/ReviewMergeForm";
import { getChampionBySlug } from "@/data/champions";
import { requirePageAdmin } from "@/lib/authGuard";
import { approveEditAction, rejectEditAction } from "@/lib/actions/wikiEditActions";
import { getEditForReview } from "@/lib/wikiEditStore";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "편집 검토" };

type Params = { editId: string };
type SearchParams = { error?: string };

const ERROR_LABEL: Record<string, string> = {
  need_reason: "거절하려면 사유를 입력해야 합니다.",
  approve_failed: "승인할 수 없습니다. 문서가 그 사이 바뀌었을 수 있습니다.",
  reject_failed: "거절할 수 없습니다. 이미 처리되었을 수 있습니다.",
};

/** 편집 제안 상세 검토 화면 (FR-27, FR-28). */
export default async function ReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  await requirePageAdmin();
  const { editId } = await params;
  const { error } = await searchParams;
  const detail = await getEditForReview(editId);
  if (!detail) notFound();

  const champion = getChampionBySlug(detail.championSlug);
  const sectionLabel = detail.meSlug ? (getChampionBySlug(detail.meSlug)?.name ?? detail.meSlug) : "공통";
  const stale = detail.baseRevision !== detail.currentRevision;

  const boundApprove = approveEditAction.bind(null, detail.id, detail.championSlug);
  const boundReject = rejectEditAction.bind(null, detail.id);

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">관리자</p>
      <h1 className={`display ${styles.title}`}>
        {champion?.name ?? detail.championSlug} 상대법 · {sectionLabel}
      </h1>
      <p className="mono">{detail.authorName ?? "탈퇴 계정"} · r{detail.baseRevision} 기준 제출</p>

      {error && <p className={styles.error}>{ERROR_LABEL[error] ?? "처리할 수 없습니다."}</p>}

      {stale && (
        <details className={styles.stale} open>
          <summary>
            이 제안은 r{detail.baseRevision}를 기준으로 작성되었습니다. 현재 문서는 r{detail.currentRevision}입니다.
            그 사이 이 섹션이 {detail.staleChanges.length}번 바뀌었습니다.
          </summary>
          <ul className={styles.staleList}>
            {detail.staleChanges.map((c) => (
              <li key={c.id}>
                r{c.revision} · {c.authorName ?? "탈퇴 계정"} · {c.summary || "(요약 없음)"}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/*
        * 좌우 두 면과 `반영할 내용` 입력칸은 한 덩어리다. 검토자가 오른쪽을 고칠 때마다
        * 양쪽 형광펜이 다시 칠해져야 하므로 클라이언트에서 산다. 서버 액션은 그대로
        * 바인딩해 내려보낸다 — 인증과 권한 검증은 여전히 서버가 한다.
        */}
      <ReviewMergeForm
        currentBody={detail.currentBody}
        proposedBody={detail.body}
        summary={detail.summary}
        approveAction={boundApprove}
        rejectAction={boundReject}
      />

      <Link href="/admin/wiki/review" className={styles.back}>
        대기열로 돌아가기
      </Link>
    </div>
  );
}
