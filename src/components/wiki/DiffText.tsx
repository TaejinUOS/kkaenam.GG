import type { DiffOp } from "@/lib/wikiDiff";

import styles from "./DiffText.module.css";

type Props = {
  ops: DiffOp[];
  /**
   * 어느 쪽 글을 그리는가.
   * - `before` : 고치기 전 글. 사라지는 조각에 빨간 형광펜이 간다.
   * - `after`  : 고친 뒤의 글. 새로 쓴 조각에 초록 형광펜이 간다.
   */
  side: "before" | "after";
  className?: string;
  /** 글이 아예 비었을 때 대신 보여줄 말. */
  placeholder?: string;
};

/**
 * 형광펜을 칠한 본문 — 병합 편집기의 왼쪽 화면과 검토 화면이 함께 쓴다.
 *
 * 마크다운으로 그리지 않고 **원문 그대로** 보여준다. 지워지는 것이 `**`인지 글자인지를
 * 봐야 하는 자리라, 문법을 해석해 버리면 정작 판단할 것이 화면에서 사라진다.
 *
 * 색만으로 구별하지 않는다. 지운 곳에는 취소선이, 더한 곳에는 밑줄이 함께 간다 —
 * 적록색약인 사람에게 이 화면은 색이 전부이면 아무 정보도 주지 못한다.
 */
export function DiffText({ ops, side, className, placeholder = "(비어 있음)" }: Props) {
  const shown = ops.filter((op) => op.type === "equal" || op.type === (side === "before" ? "remove" : "add"));
  const isEmpty = shown.every((op) => op.text === "");

  if (isEmpty) {
    return <div className={`${styles.text} ${className ?? ""}`}>{placeholder}</div>;
  }

  return (
    <div className={`${styles.text} ${className ?? ""}`}>
      {shown.map((op, index) =>
        op.type === "equal" ? (
          <span key={index}>{op.text}</span>
        ) : (
          <mark key={index} className={op.type === "add" ? styles.add : styles.remove}>
            {op.text}
          </mark>
        ),
      )}
    </div>
  );
}
