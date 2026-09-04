"use client";

import { useRef } from "react";

import type { DiffOp } from "@/lib/wikiDiff";

import styles from "./HighlightedEditor.module.css";

type Props = {
  /** 폼 필드 이름. 서버 액션이 이 이름으로 본문을 읽는다. */
  name: string;
  /** 처음 담기는 값. 비제어 입력이라 이후에는 이 값을 되돌려 쓰지 않는다. */
  defaultValue: string;
  /**
   * 형광펜을 칠할 차이. `equal`과 `add`를 이으면 지금 입력칸의 값과 정확히 같아야 한다 —
   * 사본과 입력칸이 한 글자도 어긋나지 않는다는 전제가 이 성질에서 온다.
   */
  ops: DiffOp[];
  onChange: (value: string) => void;
  maxLength?: number;
  ariaLabel: string;
  /** 바깥에서 높이를 정한다. 화면마다 쓸 수 있는 높이가 다르다. */
  className?: string;
};

/**
 * 초록 형광펜이 깔린 입력칸 — 편집 화면과 검토 화면이 함께 쓴다.
 *
 * **글자를 겹쳐 그리지 않는다.** 입력칸의 글자를 투명하게 하고 밑에 색칠한 사본을 까는
 * 흔한 방법은 한글에서 쓸 수 없다 — 조합 중인 글자는 아직 값이 아니라서 사본에
 * 나타나지 않고, 받침을 넣는 동안 글자가 사라진다.
 *
 * 그래서 반대로 한다. **사본의 글자를 투명하게 두고 배경만 남긴다.** 읽히는 글자는
 * 언제나 textarea 자신의 것이고, 밑의 사본은 색칠한 네모만 제공한다. 치수가 조금
 * 어긋나도 최악이 "형광펜이 반 글자 밀림"이지 글자가 사라지지는 않는다.
 *
 * 그 대신 두 겹의 글자 치수가 정확히 같아야 한다 — CSS의 `.text` 하나를 함께 쓰는
 * 이유이고, 그 값을 고칠 때는 반드시 둘 다에 적용되는지 확인해야 한다.
 *
 * textarea를 제어 컴포넌트로 만들지 않는 것도 같은 이유다. 조합이 끝나기 전에 React가
 * value를 되돌려 쓰면 조합이 깨진다. 값의 주인은 DOM이고, `onChange`로 올려 보내는
 * 것은 형광펜을 그리기 위한 사본일 뿐이다.
 */
export function HighlightedEditor({
  name,
  defaultValue,
  ops,
  onChange,
  maxLength,
  ariaLabel,
  className,
}: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={`${styles.text} ${styles.backdrop}`} ref={backdropRef} aria-hidden="true">
        {ops
          .filter((op) => op.type !== "remove")
          .map((op, index) =>
            op.type === "add" ? (
              <mark key={index} className={styles.addMark}>
                {op.text}
              </mark>
            ) : (
              <span key={index}>{op.text}</span>
            ),
          )}
        {/* 끝의 줄바꿈까지 높이를 갖게 한다. 없으면 마지막 줄에서 두 겹이 어긋난다. */}
        {"\n"}
      </div>

      <textarea
        name={name}
        className={`${styles.text} ${styles.input}`}
        defaultValue={defaultValue}
        maxLength={maxLength}
        spellCheck={false}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.currentTarget.value)}
        onScroll={(e) => {
          const backdrop = backdropRef.current;
          if (!backdrop) return;
          backdrop.scrollTop = e.currentTarget.scrollTop;
          backdrop.scrollLeft = e.currentTarget.scrollLeft;
        }}
      />
    </div>
  );
}
