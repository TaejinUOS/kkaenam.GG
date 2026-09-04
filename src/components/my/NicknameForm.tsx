"use client";

import { useActionState } from "react";

import { renameAction, type ProfileState } from "@/lib/actions/profileActions";

import styles from "./NicknameForm.module.css";

type Props = {
  currentName: string;
  minLength: number;
  maxLength: number;
  /** 다음에 바꿀 수 있는 날. 지금 바꿀 수 있으면 null. */
  lockedUntil: string | null;
};

/**
 * 닉네임 변경 폼.
 *
 * 거절 사유를 입력 칸 옆에 그대로 보여 줘야 해서 `useActionState`를 쓴다 —
 * "이미 쓰이는 닉네임입니다"를 리다이렉트로 알리면 사용자가 방금 뭘 쳤는지 잃는다.
 */
export function NicknameForm({ currentName, minLength, maxLength, lockedUntil }: Props) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(renameAction, null);
  const locked = Boolean(lockedUntil);

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>닉네임</span>
        <input
          type="text"
          name="name"
          className={styles.input}
          defaultValue={currentName}
          minLength={minLength}
          maxLength={maxLength}
          required
          disabled={locked}
          autoComplete="nickname"
          /* 화면의 검사는 편의일 뿐이다. 실제 판정은 저장 시점에 서버가 한다. */
          aria-describedby="nickname-help"
        />
      </label>

      <button type="submit" className="btn btn--acid" disabled={pending || locked}>
        {pending ? "저장 중" : "저장"}
      </button>

      <p id="nickname-help" className={styles.help}>
        {locked
          ? `${lockedUntil}부터 다시 바꿀 수 있습니다.`
          : `${minLength}~${maxLength}자. 바꾸면 지난 편집에 표시되는 이름도 함께 바뀝니다.`}
      </p>

      {state && (
        <p className={state.ok ? styles.ok : styles.error} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
