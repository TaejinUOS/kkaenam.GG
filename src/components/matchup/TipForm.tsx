"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { MeBlock, Tip } from "@/data/types";
import {
  getUserTip,
  loadUser,
  newMeBlockId,
  newTipId,
  saveUserTip,
  signIn,
  type LocalUser,
} from "@/lib/tipStore";
import { buildQuery } from "@/lib/url";

import { MeCombobox } from "./MeCombobox";
import styles from "./TipForm.module.css";
import type { CategoryView, ChampionOption, PositionView } from "./types";

/**
 * 입력 길이 제한.
 * PRD 15의 미결정 사항 6번(최소·최대 길이)과 7번(Me 블록 최대 개수)이 정해지기 전까지
 * 사용하는 잠정값이다. 값이 확정되면 이 상수만 바꾸면 된다.
 */
const LIMITS = {
  titleMin: 4,
  titleMax: 60,
  generalMin: 20,
  generalMax: 1500,
  meMin: 10,
  meMax: 800,
  meBlockMax: 10,
} as const;

type DraftMe = { id: string; championSlug: string | null; body: string };

type Props = {
  patch: string;
  position: PositionView;
  category: CategoryView;
  champion: ChampionOption;
  positionChampions: ChampionOption[];
  allChampions: ChampionOption[];
};

export function TipForm({
  patch,
  position,
  category,
  champion,
  positionChampions,
  allChampions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [user, setUser] = useState<LocalUser | null>(null);
  const [ready, setReady] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [title, setTitle] = useState("");
  const [general, setGeneral] = useState("");
  const [meBlocks, setMeBlocks] = useState<DraftMe[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  const boardHref = `/matchup/${position.slug}/${champion.slug}${buildQuery(
    searchParams.toString(),
    { edit: null },
  )}`;

  useEffect(() => {
    setUser(loadUser());
    if (editId) {
      const existing = getUserTip(editId);
      if (existing) {
        setTitle(existing.title);
        setGeneral(existing.general);
        setMeBlocks(
          existing.meBlocks.map((b) => ({
            id: b.id,
            championSlug: b.championSlug,
            body: b.body,
          })),
        );
      }
    }
    setReady(true);
  }, [editId]);

  const usedChampions = useMemo(
    () => meBlocks.map((b) => b.championSlug).filter(Boolean) as string[],
    [meBlocks],
  );

  /* ------------------------------------------------------------- 로그인 */

  if (!ready) return <div style={{ minHeight: "60vh" }} aria-hidden="true" />;

  if (!user) {
    return (
      <div className={`shell ${styles.gate}`}>
        <p className="section-index">글쓰기 / 로그인 필요</p>
        <h1 className={styles.gateTitle}>Tip을 쓰려면 로그인이 필요합니다</h1>
        <p className={styles.gateBody}>
          정식 회원가입 방식은 아직 정해지지 않았습니다. 지금은 이 브라우저에만 저장되는
          <strong> 로컬 데모 계정</strong>으로 작성 흐름을 확인할 수 있습니다. 작성한 Tip은 다른
          사람에게 전달되지 않고 이 브라우저에만 남습니다.
        </p>

        <form
          className={styles.gateForm}
          onSubmit={(event) => {
            event.preventDefault();
            setUser(signIn(nameInput));
          }}
        >
          <label className={styles.gateLabel}>
            <span>표시할 닉네임</span>
            <input
              className={styles.input}
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="예: 미드 장인"
              maxLength={20}
            />
          </label>
          <button type="submit" className="btn btn--acid">
            로컬 데모 계정 만들기
          </button>
        </form>

        <Link className={styles.gateBack} href={boardHref}>
          ← {champion.name} 게시판으로 돌아가기
        </Link>
      </div>
    );
  }

  /* --------------------------------------------------------------- 검증 */

  function validate(): string[] {
    const found: string[] = [];
    const t = title.trim();
    const g = general.trim();

    if (!t) found.push("제목을 입력해 주세요.");
    else if (t.length < LIMITS.titleMin) found.push(`제목은 ${LIMITS.titleMin}자 이상이어야 합니다.`);
    else if (t.length > LIMITS.titleMax) found.push(`제목은 ${LIMITS.titleMax}자를 넘을 수 없습니다.`);

    if (!g) found.push("General은 필수 입력입니다.");
    else if (g.length < LIMITS.generalMin)
      found.push(`General은 ${LIMITS.generalMin}자 이상이어야 합니다.`);
    else if (g.length > LIMITS.generalMax)
      found.push(`General은 ${LIMITS.generalMax}자를 넘을 수 없습니다.`);

    const seen = new Set<string>();
    meBlocks.forEach((block, index) => {
      const body = block.body.trim();
      const hasChampion = Boolean(block.championSlug);
      const hasBody = Boolean(body);

      // 챔피언과 내용 중 하나만 채워진 블록은 저장하지 않는다 (PRD 5.4).
      if (hasChampion !== hasBody) {
        found.push(
          `${index + 1}번 Me 블록: ${hasChampion ? "전용 내용을 입력해 주세요." : "챔피언을 선택해 주세요."}`,
        );
        return;
      }
      if (!hasChampion) return;

      if (body.length < LIMITS.meMin)
        found.push(`${index + 1}번 Me 블록의 내용은 ${LIMITS.meMin}자 이상이어야 합니다.`);
      if (body.length > LIMITS.meMax)
        found.push(`${index + 1}번 Me 블록의 내용은 ${LIMITS.meMax}자를 넘을 수 없습니다.`);

      // 같은 Tip 안에서 동일한 챔피언을 중복 선택할 수 없다 (PRD 5.4).
      if (seen.has(block.championSlug!)) {
        const name = allChampions.find((c) => c.slug === block.championSlug)?.name ?? "";
        found.push(`${name}이(가) 여러 Me 블록에 중복 선택되었습니다.`);
      }
      seen.add(block.championSlug!);
    });

    return found;
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);

    if (found.length > 0) {
      setStatus("error");
      return;
    }

    setStatus("saving");

    const now = new Date().toISOString();
    const existing = editId ? getUserTip(editId) : undefined;

    const blocks: MeBlock[] = meBlocks
      .filter((b) => b.championSlug && b.body.trim())
      .map((b, index) => ({
        id: b.id,
        championSlug: b.championSlug!,
        body: b.body.trim(),
        order: index + 1,
      }));

    const tip: Tip = {
      id: existing?.id ?? newTipId(),
      // 상대 포지션과 상대 챔피언은 현재 페이지 값으로 고정한다 (PRD 5.4).
      positionSlug: position.slug,
      championSlug: champion.slug,
      authorId: user!.id,
      authorName: user!.name,
      title: title.trim(),
      general: general.trim(),
      meBlocks: blocks,
      patch: existing?.patch ?? patch,
      likes: existing?.likes ?? 0,
      dislikes: existing?.dislikes ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    saveUserTip(tip);
    router.push(
      `/matchup/${position.slug}/${champion.slug}/tips/${tip.id}${buildQuery(
        searchParams.toString(),
        { edit: null },
      )}`,
    );
  }

  return (
    <div className={styles.screen}>
      <div className="shell">
        <nav className={styles.crumbs} aria-label="현재 위치">
          <Link className={styles.crumbLink} href={`/?position=${position.slug}`}>
            상대법
          </Link>
          <span aria-hidden="true">/</span>
          <Link className={styles.crumbLink} href={boardHref}>
            {position.name} · {champion.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className={styles.crumbCurrent}>{editId ? "수정" : "글쓰기"}</span>
        </nav>
      </div>

      <div className={`shell ${styles.wrap}`}>
        <form className={`${styles.sheet} on-paper`} onSubmit={onSubmit} noValidate>
          {/* ----------------------------------------------------- 머리글 */}
          <header className={styles.head}>
            <p className="section-index">{editId ? "Tip 수정" : "Tip 쓰기"}</p>
            <h1 className={styles.title}>
              {position.name}에서 <span className={styles.target}>{champion.name}</span> 상대하기
            </h1>

            {/* 상대 포지션·챔피언은 자동 지정이며 폼에서 바꿀 수 없다. */}
            <p className={styles.fixed}>
              <img src={champion.iconUrl} alt="" width={26} height={26} />
              <span>
                이 Tip의 상대는 <strong>{position.name} {champion.name}</strong>로 고정됩니다.
              </span>
              <Link className={styles.changeLink} href={`/?position=${position.slug}&category=${category.slug}`}>
                다른 챔피언 고르기
              </Link>
            </p>

            <p className={`mono ${styles.demo}`}>
              로컬 데모 계정 · {user.name} — 작성한 Tip은 이 브라우저에만 저장됩니다.
            </p>
          </header>

          {/* -------------------------------------------------------- 오류 */}
          {status === "error" && errors.length > 0 && (
            <div className={styles.errors} role="alert">
              <p className={styles.errorsTitle}>저장하지 못했습니다. 아래 항목을 확인해 주세요.</p>
              <ul>
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* -------------------------------------------------------- 제목 */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tip-title">
              제목
              <span className={styles.required}>필수</span>
            </label>
            <input
              id="tip-title"
              className={styles.input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 매혹(E)이 빠진 12초가 전부입니다"
              maxLength={LIMITS.titleMax}
            />
            <p className={`mono ${styles.counter}`}>
              {title.trim().length} / {LIMITS.titleMax}
            </p>
          </div>

          {/* ------------------------------------------------------ General */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tip-general">
              <span className="sticker sticker--cobalt">general</span>
              누구에게나 적용되는 상대법
              <span className={styles.required}>필수</span>
            </label>
            <p className={styles.help}>
              내 챔피언이 무엇이든 항상 통하는 내용을 씁니다. 스킬 쿨타임, 위험 구간, 라인 운영처럼
              상대 챔피언 자체의 약점을 설명해 주세요.
            </p>
            <textarea
              id="tip-general"
              className={styles.textarea}
              value={general}
              onChange={(event) => setGeneral(event.target.value)}
              rows={7}
              maxLength={LIMITS.generalMax}
              placeholder={`예: ${champion.name}의 하드 CC는 하나뿐이고 쿨타임이 깁니다. 그 스킬이 빠진 구간을 노려…`}
            />
            <p className={`mono ${styles.counter}`}>
              {general.trim().length} / {LIMITS.generalMax}
            </p>
          </div>

          {/* ----------------------------------------------------------- Me */}
          <section className={styles.meSection} aria-labelledby="me-section-title">
            <div className={styles.meHead}>
              <h2 id="me-section-title" className={styles.label}>
                <span className="sticker sticker--gum">me</span>
                내 챔피언 전용 상대법
                <span className={styles.optional}>선택</span>
              </h2>
              <p className={styles.help}>
                특정 챔피언으로 플레이할 때만 통하는 내용입니다. 챔피언 하나에 내용 하나씩 추가하고,
                같은 챔피언을 두 번 고를 수는 없습니다.
              </p>
            </div>

            {meBlocks.length > 0 && (
              <ol className={styles.meList}>
                {meBlocks.map((block, index) => (
                  <li key={block.id} className={styles.meBlock}>
                    <div className={styles.meBlockHead}>
                      <span className={`mono ${styles.meIndex}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className={styles.meCombo}>
                        <MeCombobox
                          positionChampions={positionChampions}
                          allChampions={allChampions}
                          positionName={position.name}
                          value={block.championSlug}
                          onChange={(slug) =>
                            setMeBlocks((blocks) =>
                              blocks.map((b) =>
                                b.id === block.id ? { ...b, championSlug: slug } : b,
                              ),
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() =>
                          setMeBlocks((blocks) => blocks.filter((b) => b.id !== block.id))
                        }
                      >
                        블록 삭제
                      </button>
                    </div>

                    {block.championSlug && usedChampions.filter((s) => s === block.championSlug).length > 1 && (
                      <p className={styles.blockWarn} role="status">
                        같은 챔피언이 다른 블록에도 선택되어 있습니다.
                      </p>
                    )}

                    <textarea
                      className={styles.textarea}
                      value={block.body}
                      rows={4}
                      maxLength={LIMITS.meMax}
                      placeholder="이 챔피언으로 플레이할 때만 적용되는 내용을 적어 주세요."
                      aria-label={`${index + 1}번 Me 블록 내용`}
                      onChange={(event) =>
                        setMeBlocks((blocks) =>
                          blocks.map((b) =>
                            b.id === block.id ? { ...b, body: event.target.value } : b,
                          ),
                        )
                      }
                    />
                    <p className={`mono ${styles.counter}`}>
                      {block.body.trim().length} / {LIMITS.meMax}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            <button
              type="button"
              className="btn"
              disabled={meBlocks.length >= LIMITS.meBlockMax}
              onClick={() =>
                setMeBlocks((blocks) => [
                  ...blocks,
                  { id: newMeBlockId(), championSlug: null, body: "" },
                ])
              }
            >
              + Me 블록 추가
              {meBlocks.length > 0 && ` (${meBlocks.length}/${LIMITS.meBlockMax})`}
            </button>
          </section>

          {/* -------------------------------------------------------- 저장 */}
          <footer className={styles.foot}>
            <Link className="btn" href={boardHref}>
              취소
            </Link>
            <button type="submit" className="btn btn--acid" disabled={status === "saving"}>
              {status === "saving" ? "저장 중…" : editId ? "수정 저장" : "Tip 저장"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
