"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Tip } from "@/data/types";
import {
  applyVotes,
  loadUser,
  loadUserTips,
  loadVotes,
  meBlockFor,
  mergeTips,
  sortTips,
  toggleVote,
  type LocalUser,
  type VoteMap,
} from "@/lib/tipStore";
import { buildQuery, matchesName, normalizeQuery } from "@/lib/url";

import { MeCombobox } from "./MeCombobox";
import styles from "./TipBoard.module.css";
import type { ChampionOption, ChampionView, PositionView } from "./types";

const PER_PAGE = 8;

type Props = {
  position: PositionView;
  champion: ChampionView;
  seedTips: Tip[];
  positionChampions: ChampionOption[];
  allChampions: ChampionOption[];
  patch: string;
  currentQuery: string;
};

export function TipBoard({
  position,
  champion,
  seedTips,
  positionChampions,
  allChampions,
  currentQuery,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /*
   * localStorage는 서버에 없으므로 첫 렌더는 시드 Tip만으로 그리고,
   * 마운트 후 로컬 작성분과 평가를 합친다. 하이드레이션 불일치를 피하기 위한 순서다.
   */
  const [localTips, setLocalTips] = useState<Tip[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    setLocalTips(loadUserTips());
    setVotes(loadVotes());
    setUser(loadUser());
  }, []);

  const meSlug = searchParams.get("me");
  const sort = searchParams.get("sort") === "recent" ? "recent" : "likes";
  const urlTerm = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const setParams = useCallback(
    (patchParams: Record<string, string | null>) => {
      router.replace(`${pathname}${buildQuery(searchParams.toString(), patchParams)}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  /* 입력은 즉시 반영하고 URL 반영만 늦춰 뒤로 가기가 글자 단위로 쪼개지지 않게 한다. */
  const [term, setTerm] = useState(urlTerm);

  useEffect(() => {
    if (term === urlTerm) return;
    const id = setTimeout(() => setParams({ q: term || null, page: null }), 250);
    return () => clearTimeout(id);
  }, [term, urlTerm, setParams]);

  const meChampion = allChampions.find((c) => c.slug === meSlug) ?? null;

  const tips = useMemo(() => {
    const scoped = localTips.filter(
      (t) => t.positionSlug === position.slug && t.championSlug === champion.slug,
    );
    return mergeTips(seedTips, scoped);
  }, [seedTips, localTips, position.slug, champion.slug]);

  /** 검색 대상은 제목, General, 그리고 현재 선택된 Me 내용뿐이다 (PRD 5.3.3, FR-16). */
  const filtered = useMemo(() => {
    const needle = normalizeQuery(term);
    if (!needle) return tips;
    return tips.filter((tip) => {
      const me = meBlockFor(tip, meSlug);
      return matchesName(needle, tip.title, tip.general, me?.body ?? "");
    });
  }, [tips, term, meSlug]);

  const sorted = useMemo(() => sortTips(filtered, votes, sort), [filtered, votes, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const visible = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const onVote = useCallback((tipId: string, kind: "like" | "dislike") => {
    setVotes(toggleVote(tipId, kind));
  }, []);

  return (
    <div className={styles.board}>
      {/* ------------------------------------------------------ 컨트롤 줄 */}
      <div className={styles.controls}>
        <MeCombobox
          positionChampions={positionChampions}
          allChampions={allChampions}
          positionName={position.name}
          value={meSlug}
          onChange={(slug) => setParams({ me: slug, page: null })}
        />

        <div className={styles.controlsRight}>
          <label className={styles.sort}>
            <span className="sr-only">정렬 기준</span>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(event) =>
                setParams({ sort: event.target.value === "recent" ? "recent" : null, page: null })
              }
            >
              <option value="likes">좋아요순</option>
              <option value="recent">최신순</option>
            </select>
          </label>

          <Link className="btn btn--acid" href={`${pathname}/write${currentQuery}`}>
            글쓰기
          </Link>
        </div>
      </div>

      {/* --------------------------------------------------------- 검색 */}
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <span className="sr-only">
            제목과 General{meChampion ? `, ${meChampion.name} 전용 내용` : ""}에서 검색
          </span>
          <input
            className={styles.searchInput}
            type="search"
            value={term}
            placeholder="제목과 내용 검색"
            autoComplete="off"
            onChange={(event) => setTerm(event.target.value)}
          />
        </label>

        <p className={`mono ${styles.resultCount}`}>
          {term ? `${sorted.length} / ${tips.length}` : sorted.length}건
        </p>
      </div>

      {/* Me 선택 안내 */}
      {meChampion ? (
        <p className={styles.meNotice}>
          <span className="sticker sticker--gum">내 챔피언 전용</span>
          <span>
            <strong>{meChampion.name}</strong>로 플레이할 때만 적용되는 내용이 함께 표시됩니다.
          </span>
        </p>
      ) : (
        <p className={styles.meNotice}>
          <span className="sticker sticker--cobalt">general</span>
          <span>
            지금은 누구에게나 적용되는 상대법만 보고 있습니다. 위에서 내 챔피언을 고르면 전용
            상대법이 더 나타납니다.
          </span>
        </p>
      )}

      {/* --------------------------------------------------------- 목록 */}
      {visible.length > 0 ? (
        <ol className={styles.list} start={(safePage - 1) * PER_PAGE + 1}>
          {visible.map((tip, index) => (
            <TipArticle
              key={tip.id}
              tip={tip}
              rank={(safePage - 1) * PER_PAGE + index + 1}
              meSlug={meSlug}
              meName={meChampion?.name ?? null}
              votes={votes}
              onVote={onVote}
              href={`${pathname}/tips/${tip.id}${currentQuery}`}
              isAuthor={Boolean(user && user.id === tip.authorId)}
            />
          ))}
        </ol>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {term ? "검색 결과가 없습니다." : `${champion.name} 상대법이 아직 없습니다.`}
          </p>
          <p className={styles.emptyBody}>
            {term
              ? "검색어를 지우면 전체 Tip이 다시 나타납니다."
              : `${position.name}에서 ${champion.name}를 상대해 본 경험을 첫 번째 Tip으로 남겨 주세요.`}
          </p>
          <div className={styles.emptyActions}>
            {term && (
              <button type="button" className="btn" onClick={() => setTerm("")}>
                검색어 지우기
              </button>
            )}
            <Link className="btn btn--acid" href={`${pathname}/write${currentQuery}`}>
              글쓰기
            </Link>
          </div>
        </div>
      )}

      {/* --------------------------------------------------- 페이지네이션 */}
      {pageCount > 1 && (
        <nav className={styles.pager} aria-label="페이지">
          <button
            type="button"
            className={styles.pagerBtn}
            disabled={safePage === 1}
            onClick={() => setParams({ page: safePage - 1 === 1 ? null : String(safePage - 1) })}
          >
            이전
          </button>

          <ul className={styles.pagerList}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <li key={n}>
                <button
                  type="button"
                  className={`mono ${styles.pagerNum} ${n === safePage ? styles.pagerNumCurrent : ""}`}
                  aria-current={n === safePage ? "page" : undefined}
                  onClick={() => setParams({ page: n === 1 ? null : String(n) })}
                >
                  {String(n).padStart(2, "0")}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={styles.pagerBtn}
            disabled={safePage === pageCount}
            onClick={() => setParams({ page: String(safePage + 1) })}
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Tip 기사 */

type ArticleProps = {
  tip: Tip;
  rank: number;
  meSlug: string | null;
  meName: string | null;
  votes: VoteMap;
  onVote: (tipId: string, kind: "like" | "dislike") => void;
  href: string;
  isAuthor: boolean;
};

function TipArticle({ tip, rank, meSlug, meName, votes, onVote, href, isAuthor }: ArticleProps) {
  const me = meBlockFor(tip, meSlug);
  const { vote, likes, dislikes } = applyVotes(tip, votes);

  return (
    <li className={styles.article}>
      {/* 왼쪽 56px 랭킹 번호 (블루프린트 6.3) */}
      <p className={`mono ${styles.rank}`} aria-hidden="true">
        {String(rank).padStart(2, "0")}
      </p>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className="sticker sticker--cobalt">general</span>
          <h3 className={styles.title}>
            <Link href={href} className={styles.titleLink}>
              {tip.title}
            </Link>
          </h3>
          {isAuthor && <span className={`sticker ${styles.mine}`}>내 글</span>}
        </div>

        {/*
          Me 미선택 시 General 3줄, 선택 시 General 2줄 + Me 1줄 (블루프린트 6.3).
          Me가 없는 Tip은 빈 영역을 예약하지 않는다.
        */}
        <p className={`${styles.general} ${me ? styles.generalWithMe : ""}`}>{tip.general}</p>

        {me && (
          <p className={styles.me}>
            <span className="sticker sticker--gum">me / {meName}</span>
            <span className={styles.meBody}>{me.body}</span>
          </p>
        )}
      </div>

      {/* 오른쪽 메타데이터 */}
      <div className={styles.meta}>
        <p className={styles.author}>
          <span className={styles.avatar} aria-hidden="true" />
          {tip.authorName}
        </p>
        <p className={`mono ${styles.metaLine}`}>
          <span>{formatDate(tip.createdAt)}</span>
          <span aria-hidden="true">|</span>
          <span>패치 {tip.patch}</span>
        </p>
        <div className={styles.votes}>
          <button
            type="button"
            className={`mono ${styles.voteBtn} ${vote === "like" ? styles.voteOn : ""}`}
            aria-pressed={vote === "like"}
            onClick={() => onVote(tip.id, "like")}
          >
            <span aria-hidden="true">▲</span> {likes}
            <span className="sr-only">좋아요</span>
          </button>
          <button
            type="button"
            className={`mono ${styles.voteBtn} ${vote === "dislike" ? styles.voteOff : ""}`}
            aria-pressed={vote === "dislike"}
            onClick={() => onVote(tip.id, "dislike")}
          >
            <span aria-hidden="true">▼</span> {dislikes}
            <span className="sr-only">싫어요</span>
          </button>
        </div>
      </div>
    </li>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
