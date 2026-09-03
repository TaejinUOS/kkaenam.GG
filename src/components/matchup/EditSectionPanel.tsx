"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { MAX_BODY_LENGTH, MAX_SUMMARY_LENGTH } from "@/data/wiki";
import { submitEditAction, type ActionState } from "@/lib/actions/wikiEditActions";
import { buildQuery } from "@/lib/url";

import styles from "./EditSectionPanel.module.css";

type Props = {
  positionSlug: string;
  championSlug: string;
  patch: string;
  /** null이면 공통 섹션. */
  meSlug: string | null;
  sectionTitle: string;
  /** 편집기를 여는 시점의 실제 서버 상태 (FR-24) — 편집 중 바뀌어도 이 안내는 갱신하지 않는다. */
  currentBody: string;
  isEmpty: boolean;
  isAdmin: boolean;
};

/**
 * 인라인 섹션 편집기. 모달이 아니라 `?edit=` URL 상태로 열고 닫는다 — 이 화면
 * 전체가 URL 기반 상태 모델(`me`, `tab`)을 따르는 것과 같은 방식이고, 진입 링크에
 * `prefetch={false}`를 써서 열 때마다 최신 서버 상태를 읽게 한 것과도 맞물린다.
 */
export function EditSectionPanel({
  positionSlug,
  championSlug,
  patch,
  meSlug,
  sectionTitle,
  currentBody,
  isEmpty,
  isAdmin,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState<ActionState, FormData>(submitEditAction, null);
  const closedOnSuccess = useRef(false);

  const close = () => {
    router.replace(`${pathname}${buildQuery(searchParams.toString(), { edit: null })}`, { scroll: false });
  };

  useEffect(() => {
    if (state?.ok && !closedOnSuccess.current) {
      closedOnSuccess.current = true;
      router.refresh();
    }
  }, [state, router]);

  const notice = isAdmin
    ? "관리자 권한으로 저장 즉시 반영됩니다."
    : isEmpty
      ? "아직 아무도 쓰지 않은 부분입니다. 저장하면 바로 반영됩니다."
      : "이미 내용이 있는 부분이라 저장 즉시 반영되지 않습니다. 운영자 검토를 거쳐 반영되며 며칠이 걸릴 수 있습니다. 작성한 내용은 저장되니 내 편집에서 진행 상황을 확인할 수 있습니다.";

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className="mono">{sectionTitle} 편집</span>
        <button type="button" className={styles.close} onClick={close} aria-label="편집 닫기">
          닫기
        </button>
      </div>

      <p className={`${styles.notice} ${isEmpty || isAdmin ? styles.noticeInstant : styles.noticePending}`}>
        {notice}
      </p>

      <form action={formAction} className={styles.form}>
        <input type="hidden" name="positionSlug" value={positionSlug} />
        <input type="hidden" name="championSlug" value={championSlug} />
        <input type="hidden" name="patch" value={patch} />
        {meSlug && <input type="hidden" name="meSlug" value={meSlug} />}

        <BodyField defaultValue={currentBody} />
        <SummaryField />

        {state && !state.ok && <p className={styles.error}>{state.message}</p>}
        {state?.ok && <p className={styles.success}>{state.message}</p>}

        <div className={styles.actions}>
          <SubmitButton />
          <button type="button" className="btn" onClick={close}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

function BodyField({ defaultValue }: { defaultValue: string }) {
  return (
    <div className={styles.field}>
      <label className={styles.field}>
        <span className={styles.label}>
          본문 (마크다운 지원, 최대 {MAX_BODY_LENGTH.toLocaleString()}자)
        </span>
        <textarea
          name="body"
          className={styles.textarea}
          defaultValue={defaultValue}
          maxLength={MAX_BODY_LENGTH}
          rows={10}
          required
        />
      </label>
      <SyntaxHelp />
    </div>
  );
}

/**
 * 이 위키에만 있는 문법 안내.
 *
 * 접어 두는 것은 처음 쓰는 사람의 화면을 문법 설명으로 덮지 않기 위해서다. 문법을
 * 몰라도 그냥 쓰면 문단이 되고, 필요할 때 펼쳐 보면 된다.
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
          <code>본문[^쿨타임]</code> · 아래쪽에 <code>[^쿨타임]: 설명</code>
        </dt>
        <dd>주석이 된다. 읽는 사람이 표식에 마우스를 올리면 설명이 그 자리에 뜬다.</dd>

        <dt>
          <code>[[미드/아리]]</code> · <code>[[미드/아리|아리 상대법]]</code>
        </dt>
        <dd>다른 상대법 문서로 가는 링크. 없는 문서는 빨갛게 보여 오타를 알 수 있다.</dd>

        <dt>
          <code>**굵게**</code> <code>- 목록</code> <code>&gt; 인용</code>{" "}
          <code>[글](https://…)</code>
        </dt>
        <dd>보통의 마크다운도 그대로 쓸 수 있다. HTML 태그는 글자 그대로 보인다.</dd>
      </dl>
    </details>
  );
}

function SummaryField() {
  return (
    <label className={styles.field}>
      <span className={styles.label}>편집 요약 (선택, 최대 {MAX_SUMMARY_LENGTH}자)</span>
      <input
        type="text"
        name="summary"
        className={styles.input}
        maxLength={MAX_SUMMARY_LENGTH}
        placeholder="예: Q 쿨타임 수정"
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--acid" disabled={pending}>
      {pending ? "저장 중..." : "저장"}
    </button>
  );
}
