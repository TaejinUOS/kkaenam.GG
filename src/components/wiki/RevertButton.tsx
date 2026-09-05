"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { revertDocAction, type ActionState } from "@/lib/actions/wikiEditActions";

import styles from "./RevertButton.module.css";

/** `doc`은 `encodeDocRef`가 지은 문서 참조다. 매치업이든 일반 문서든 같은 버튼을 쓴다. */
type Props = { doc: string; targetRevision: number };

/**
 * 문서를 이 리비전으로 되돌리는 버튼 (FR-30, 관리자 전용).
 * 되돌리기 어려운 행동이라 `window.confirm` 대신 인라인 2단계 확인을 쓴다.
 */
export function RevertButton({ doc, targetRevision }: Props) {
  const [confirming, setConfirming] = useState(false);
  const boundAction = revertDocAction.bind(null, doc, targetRevision);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);

  if (state) {
    return <p className={state.ok ? styles.success : styles.error}>{state.message}</p>;
  }

  if (!confirming) {
    return (
      <button type="button" className={`btn ${styles.trigger}`} onClick={() => setConfirming(true)}>
        r{targetRevision}으로 되돌리기
      </button>
    );
  }

  return (
    <form action={formAction} className={styles.confirm}>
      <span>r{targetRevision} 직후 상태로 되돌립니다. 확실합니까?</span>
      <ConfirmButton />
      <button type="button" className="btn" onClick={() => setConfirming(false)}>
        취소
      </button>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--acid" disabled={pending}>
      {pending ? "되돌리는 중..." : "되돌리기 확정"}
    </button>
  );
}
