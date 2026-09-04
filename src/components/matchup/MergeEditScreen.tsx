"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { DiffText } from "@/components/wiki/DiffText";
import { HighlightedEditor } from "@/components/wiki/HighlightedEditor";
import { MAX_BODY_LENGTH, MAX_SUMMARY_LENGTH } from "@/data/wiki";
import { submitEditAction, type ActionState } from "@/lib/actions/wikiEditActions";
import { diffStats, diffWords, hasRemoval } from "@/lib/wikiDiff";

import styles from "./MergeEditScreen.module.css";

type Props = {
  positionSlug: string;
  positionName: string;
  championSlug: string;
  championName: string;
  patch: string;
  /** null이면 공통 섹션. */
  meSlug: string | null;
  /** 고치고 있는 섹션의 제목. 예: `제드로 상대할 때`. */
  sectionTitle: string;
  /** 편집기를 여는 시점의 실제 서버 상태. 왼쪽 화면이자 차이의 기준이다. */
  currentBody: string;
  isAdmin: boolean;
  /** 저장하거나 취소했을 때 돌아갈 곳. 고친 섹션 제목으로 바로 간다. */
  returnHref: string;
};

/**
 * 문서 편집 화면 — 왼쪽에 지금 문서, 오른쪽에 내가 쓰는 글을 나란히 놓는다.
 *
 * 문서 아래 붙는 작은 상자가 아니라 **화면 하나를 통째로 쓰는 별도 주소**다
 * (`/matchup/…/edit?section=…`). 상대법 본문은 몇 문단씩 되는 글이라, 좁은 상자
 * 안에서는 무엇을 고쳤는지 보이지 않는다.
 *
 * 색이 이 화면의 요점이다. 초록은 더한 것, 빨강은 지운 것이고, **빨강이 하나라도
 * 있으면 운영자 검토를 거친다**. 타이핑할 때마다 다시 칠하므로, 저장 버튼을 누르기
 * 전에 자기 편집이 어느 쪽인지 늘 보인다.
 *
 * 판정 자체는 화면이 하지 않는다. 서버가 저장 시점의 실제 본문으로 같은 함수
 * (`isAdditionOnly`)를 다시 돌린다 — 여기 색은 그 결과를 미리 보여 주는 것일 뿐이다
 * (`docs/WIKI_MODEL.md` "판정은 서버가 한다").
 */
export function MergeEditScreen({
  positionSlug,
  positionName,
  championSlug,
  championName,
  patch,
  meSlug,
  sectionTitle,
  currentBody,
  isAdmin,
  returnHref,
}: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState<ActionState, FormData>(submitEditAction, null);

  /*
   * textarea를 제어 컴포넌트로 만들지 않는다. 한글은 조합 중인 글자가 확정되기 전에도
   * input 이벤트가 오는데, 그때마다 React가 value를 되돌려 쓰면 조합이 깨진다.
   * 여기 상태는 형광펜과 안내 문구를 그리는 데만 쓰고, 실제 값은 textarea가 갖는다.
   */
  const [body, setBody] = useState(currentBody);

  const ops = useMemo(() => diffWords(currentBody, body), [currentBody, body]);
  const removing = hasRemoval(ops);
  const stats = diffStats(ops);
  const changed = body !== currentBody;

  useEffect(() => {
    // 저장이 반영됐으면 문서 화면의 캐시를 버린다. 돌아갔을 때 옛 글이 보이지 않도록.
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <div className={`shell ${styles.screen}`}>
      {/* ------------------------------------------------------------ 머리말 */}
      <header className={styles.head}>
        <div>
          <p className="section-index">
            {positionName} · {championName} 상대법 편집
          </p>
          <h1 className={`display ${styles.title}`}>{sectionTitle}</h1>
        </div>
        <Link href={returnHref} className={styles.back}>
          문서로 돌아가기
        </Link>
      </header>

      <PolicyNotice isAdmin={isAdmin} changed={changed} removing={removing} />

      {state?.ok ? (
        <SaveResult message={state.message} returnHref={returnHref} />
      ) : (
        <form action={formAction} className={styles.form}>
          <input type="hidden" name="positionSlug" value={positionSlug} />
          <input type="hidden" name="championSlug" value={championSlug} />
          <input type="hidden" name="patch" value={patch} />
          {meSlug && <input type="hidden" name="meSlug" value={meSlug} />}

          {/* ------------------------------------------------------ 좌우 화면 */}
          <div className={styles.panes}>
            <section className={styles.pane}>
              <div className={styles.paneHead}>
                <span>지금 문서</span>
                <span className={`mono ${styles.count} ${removing ? styles.countRemove : ""}`}>
                  {stats.removed > 0 ? `−${stats.removed}자` : "지운 것 없음"}
                </span>
              </div>
              <DiffText
                ops={ops}
                side="before"
                className={styles.paneBody}
                placeholder="아직 아무도 쓰지 않은 부분입니다."
              />
            </section>

            <section className={styles.pane}>
              <div className={styles.paneHead}>
                <span>내가 고친 글</span>
                <span className={`mono ${styles.count} ${stats.added > 0 ? styles.countAdd : ""}`}>
                  {stats.added > 0 ? `+${stats.added}자` : "더한 것 없음"}
                </span>
              </div>

              <HighlightedEditor
                name="body"
                defaultValue={currentBody}
                ops={ops}
                onChange={setBody}
                maxLength={MAX_BODY_LENGTH}
                ariaLabel={`${sectionTitle} 본문`}
                className={styles.editBox}
              />
            </section>
          </div>

          <p className={styles.limit}>
            <span className="mono">
              {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}자
            </span>{" "}
            · 마크다운을 쓸 수 있습니다.
          </p>

          <SyntaxHelp />

          <label className={styles.field}>
            <span className={styles.label}>편집 요약 (선택, 최대 {MAX_SUMMARY_LENGTH}자)</span>
            <input
              type="text"
              name="summary"
              className={styles.summaryInput}
              maxLength={MAX_SUMMARY_LENGTH}
              placeholder="예: Q 쿨타임 수정"
            />
          </label>

          {state && !state.ok && <p className={styles.error}>{state.message}</p>}

          <div className={styles.actions}>
            <SubmitButton removing={removing} isAdmin={isAdmin} disabled={!changed} />
            <Link href={returnHref} className="btn">
              취소
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ 안내 */

/**
 * 지금 이 편집이 바로 반영될지 검토로 갈지를 **쓰는 동안 내내** 알려 준다.
 *
 * 예전에는 편집기를 여는 순간 한 번만 알렸다. 판정 기준이 "섹션이 비었는가"에서
 * "지운 것이 있는가"로 바뀌면서, 그 답이 무엇을 쓰느냐에 따라 달라졌다. 저장을
 * 누르고 나서야 대기열로 갔다는 것을 알게 되면 그 사람은 두 번 다시 쓰지 않는다.
 */
function PolicyNotice({
  isAdmin,
  changed,
  removing,
}: {
  isAdmin: boolean;
  changed: boolean;
  removing: boolean;
}) {
  if (isAdmin) {
    return (
      <p className={`${styles.notice} ${styles.noticeInstant}`}>
        관리자 권한입니다. 지우는 편집이라도 저장 즉시 반영됩니다.
      </p>
    );
  }
  if (!changed) {
    return <p className={`${styles.notice} ${styles.noticeIdle}`}>아직 바뀐 것이 없습니다.</p>;
  }
  if (removing) {
    return (
      <p className={`${styles.notice} ${styles.noticePending}`}>
        빨간 형광펜이 있습니다 — 남이 쓴 글을 지우거나 고친 편집이라 운영자 검토를 거쳐
        반영됩니다. 며칠이 걸릴 수 있고, 쓴 내용은 「내 편집」에서 확인할 수 있습니다.
      </p>
    );
  }
  return (
    <p className={`${styles.notice} ${styles.noticeInstant}`}>
      초록 형광펜뿐입니다 — 지운 것 없이 더하기만 했으므로 저장하면 검토 없이 바로
      반영됩니다.
    </p>
  );
}

function SaveResult({ message, returnHref }: { message: string; returnHref: string }) {
  return (
    <div className={styles.done}>
      <p className={styles.doneMessage}>{message}</p>
      <Link href={returnHref} className="btn btn--acid">
        문서로 돌아가기
      </Link>
    </div>
  );
}

function SubmitButton({
  removing,
  isAdmin,
  disabled,
}: {
  removing: boolean;
  isAdmin: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const label = isAdmin ? "저장하고 반영" : removing ? "검토 요청으로 저장" : "저장하고 바로 반영";
  return (
    <button type="submit" className="btn btn--acid" disabled={pending || disabled}>
      {pending ? "저장 중..." : label}
    </button>
  );
}

/* ------------------------------------------------------------- 문법 안내 */

/**
 * 이 위키에만 있는 문법 안내. 접어 두는 것은 처음 쓰는 사람의 화면을 문법 설명으로
 * 덮지 않기 위해서다 — 몰라도 그냥 쓰면 문단이 되고, 필요할 때 펼쳐 보면 된다.
 */
function SyntaxHelp() {
  return (
    <details className={styles.help}>
      <summary className={styles.helpSummary}>쓸 수 있는 문법</summary>
      <dl className={styles.helpList}>
        <dt>
          <code># 제목</code> <code>## 소제목</code> <code>### 더 작은 제목</code>
        </dt>
        <dd>목차에 1.1, 1.1.1처럼 번호가 매겨지고 접었다 펼 수 있게 된다.</dd>

        <dt>
          <code>본문[* 설명할 내용]</code>
        </dt>
        <dd>
          주석이 된다. 번호는 나온 순서대로 붙고, 읽는 사람이 표식에 마우스를 올리면 그
          자리에 내용이 뜬다. 글 아래에 따로 모아 적지 않아도 된다.
        </dd>

        <dt>
          <code>[[미드/아리]]</code> · <code>[[미드/아리 | 아리 상대법]]</code>
        </dt>
        <dd>
          다른 문서로 가는 링크. 상대법 문서의 이름은 <code>포지션/챔피언</code>이다. 아직
          없는 문서는 빨갛게 보이니 오타를 바로 알 수 있다.
        </dd>

        <dt>
          <code>**굵게**</code> <code>- 목록</code> <code>&gt; 인용</code>{" "}
          <code>[글](https://…)</code>
        </dt>
        <dd>보통의 마크다운도 그대로 쓸 수 있다. HTML 태그는 글자 그대로 보인다.</dd>
      </dl>
    </details>
  );
}
