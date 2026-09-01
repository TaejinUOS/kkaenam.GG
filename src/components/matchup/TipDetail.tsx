"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Tip } from "@/data/types";
import {
  applyVotes,
  deleteUserTip,
  loadUser,
  loadUserTips,
  loadVotes,
  meBlockFor,
  toggleVote,
  type LocalUser,
  type VoteMap,
} from "@/lib/tipStore";
import { buildQuery } from "@/lib/url";

import styles from "./TipDetail.module.css";
import type { CategoryView, ChampionOption, PositionView } from "./types";

type Props = {
  tipId: string;
  position: PositionView;
  category: CategoryView;
  champion: ChampionOption;
  seedTips: Tip[];
  allChampions: ChampionOption[];
};

export function TipDetail({
  tipId,
  position,
  category,
  champion,
  seedTips,
  allChampions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localTips, setLocalTips] = useState<Tip[] | null>(null);
  const [votes, setVotes] = useState<VoteMap>({});
  const [user, setUser] = useState<LocalUser | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setLocalTips(loadUserTips());
    setVotes(loadVotes());
    setUser(loadUser());
  }, []);

  const meSlug = searchParams.get("me");
  const meChampion = allChampions.find((c) => c.slug === meSlug) ?? null;

  /** 게시판에서 쓰던 탭·정렬·검색·Me 상태를 그대로 들고 돌아간다 (PRD 5.5). */
  const boardHref = `/matchup/${position.slug}/${champion.slug}${buildQuery(
    searchParams.toString(),
    {},
  )}`;

  const tip = useMemo(() => {
    const fromSeed = seedTips.find((t) => t.id === tipId);
    if (fromSeed) return fromSeed;
    return localTips?.find((t) => t.id === tipId) ?? null;
  }, [seedTips, localTips, tipId]);

  // 로컬 저장분을 아직 읽지 않았다면 없는 글로 단정하지 않는다.
  if (!tip) {
    if (localTips === null) return <div className={styles.loading} aria-hidden="true" />;

    return (
      <div className={`shell ${styles.missing}`}>
        <p className="section-index">Tip / 없음</p>
        <h1 className={styles.missingTitle}>요청한 Tip을 찾을 수 없습니다.</h1>
        <p className={styles.missingBody}>
          삭제되었거나 주소가 잘못되었을 수 있습니다. {champion.name} 게시판으로 돌아가 다른 Tip을
          확인해 주세요.
        </p>
        <Link className="btn btn--acid" href={boardHref}>
          목록으로
        </Link>
      </div>
    );
  }

  const me = meBlockFor(tip, meSlug);
  const { vote, likes, dislikes } = applyVotes(tip, votes);
  const isAuthor = Boolean(user && user.id === tip.authorId);
  const edited = tip.updatedAt !== tip.createdAt;

  function onDelete() {
    deleteUserTip(tip!.id);
    router.replace(boardHref);
  }

  return (
    <div className={styles.screen}>
      <div className="shell">
        <nav className={styles.crumbs} aria-label="현재 위치">
          <Link className={styles.crumbLink} href={`/?position=${position.slug}`}>
            상대법
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className={styles.crumbLink}
            href={`/?position=${position.slug}&category=${category.slug}`}
          >
            {position.name} · {category.name}
          </Link>
          <span aria-hidden="true">/</span>
          <Link className={styles.crumbLink} href={boardHref}>
            {champion.name}
          </Link>
        </nav>
      </div>

      <article className={`shell ${styles.wrap}`}>
        <div className={`${styles.sheet} on-paper`}>
          {/* ------------------------------------------------------- 머리글 */}
          <header className={styles.head}>
            <p className={`mono ${styles.headMeta}`}>
              <img src={champion.iconUrl} alt="" width={22} height={22} />
              <span>
                {position.name} {champion.name} 상대법
              </span>
            </p>

            <h1 className={styles.title}>{tip.title}</h1>

            <div className={styles.byline}>
              <span className={styles.avatar} aria-hidden="true" />
              <span className={styles.author}>{tip.authorName}</span>
              <span className={`mono ${styles.dates}`}>
                <span>작성 {formatDate(tip.createdAt)}</span>
                {edited && <span>수정 {formatDate(tip.updatedAt)}</span>}
                <span>패치 {tip.patch}</span>
              </span>
            </div>
          </header>

          {/* ------------------------------------------------------ General */}
          <section className={styles.section} aria-labelledby="general-heading">
            <p className={styles.sectionLabel}>
              <span className="sticker sticker--cobalt">general</span>
              <span id="general-heading" className={styles.sectionName}>
                누구에게나 적용되는 상대법
              </span>
            </p>
            <p className={styles.generalBody}>{tip.general}</p>
          </section>

          {/* ----------------------------------------------------------- Me */}
          {meChampion ? (
            me ? (
              <section className={styles.section} aria-labelledby="me-heading">
                <p className={styles.sectionLabel}>
                  <span className="sticker sticker--gum">me / {meChampion.name}</span>
                  <span id="me-heading" className={styles.sectionName}>
                    내 챔피언 전용 상대법
                  </span>
                </p>
                <p className={styles.meBody}>{me.body}</p>
              </section>
            ) : (
              <p className={styles.noMe}>
                이 Tip에는 <strong>{meChampion.name}</strong> 전용 내용이 없습니다. 위 General만
                적용하세요.
              </p>
            )
          ) : (
            <p className={styles.noMe}>
              내 챔피언을 선택하면 그 챔피언에만 적용되는 전용 상대법이 함께 표시됩니다.
            </p>
          )}

          {/* --------------------------------------------------------- 평가 */}
          <footer className={styles.foot}>
            <div className={styles.votes}>
              <button
                type="button"
                className={`mono ${styles.voteBtn} ${vote === "like" ? styles.voteOn : ""}`}
                aria-pressed={vote === "like"}
                onClick={() => setVotes(toggleVote(tip.id, "like"))}
              >
                <span aria-hidden="true">▲</span> 좋아요 {likes}
              </button>
              <button
                type="button"
                className={`mono ${styles.voteBtn} ${vote === "dislike" ? styles.voteOff : ""}`}
                aria-pressed={vote === "dislike"}
                onClick={() => setVotes(toggleVote(tip.id, "dislike"))}
              >
                <span aria-hidden="true">▼</span> 싫어요 {dislikes}
              </button>
            </div>

            <div className={styles.actions}>
              {/* 작성자 본인에게만 수정·삭제를 노출한다 (PRD 5.5). */}
              {isAuthor && (
                <>
                  <Link
                    className="btn"
                    href={`/matchup/${position.slug}/${champion.slug}/write${buildQuery(
                      searchParams.toString(),
                      { edit: tip.id },
                    )}`}
                  >
                    수정
                  </Link>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    삭제
                  </button>
                </>
              )}
              <Link className="btn btn--acid" href={boardHref}>
                목록으로
              </Link>
            </div>
          </footer>
        </div>
      </article>

      {/* 되돌리기 어려운 행동에는 확인 단계를 둔다 (PRD 9). */}
      {confirmingDelete && (
        <div className={styles.confirmBackdrop} role="presentation">
          <div className={`${styles.confirm} on-paper`} role="alertdialog" aria-labelledby="confirm-title">
            <h2 id="confirm-title" className={styles.confirmTitle}>
              이 Tip을 삭제할까요?
            </h2>
            <p className={styles.confirmBody}>
              삭제하면 되돌릴 수 없습니다. &lsquo;{tip.title}&rsquo;이(가) 게시판에서 사라집니다.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>
                취소
              </button>
              <button type="button" className="btn btn--acid" onClick={onDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
