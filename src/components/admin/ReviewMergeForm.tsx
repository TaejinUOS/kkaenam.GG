"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { DiffText } from "@/components/wiki/DiffText";
import { HighlightedEditor } from "@/components/wiki/HighlightedEditor";
import { MAX_BODY_LENGTH } from "@/data/wiki";
import { diffStats, diffWords, hasRemoval } from "@/lib/wikiDiff";

import styles from "./ReviewMergeForm.module.css";

type Props = {
  /** 지금 문서의 그 섹션. 형광펜의 기준이다. */
  currentBody: string;
  /** 제안자가 낸 본문. 편집칸의 처음 값이다. */
  proposedBody: string;
  /** 제안자가 남긴 편집 요약. */
  summary: string;
  approveAction: (formData: FormData) => void;
  rejectAction: (formData: FormData) => void;
};

/**
 * 검토 화면의 좌우 병합 편집기 (FR-27, FR-28).
 *
 * 예전에는 「현재 문서」와 「제안된 내용」을 마크다운으로 나란히 그려 놓고, 그 아래
 * 별도의 `반영할 내용` 입력칸을 두었다. 같은 글이 세 번 나오는데도 **정작 무엇이
 * 사라지는지는 어디에도 없었다.**
 *
 * 그래서 오른쪽 면 자체를 그 입력칸으로 만들었다. 왼쪽은 지금 문서(사라질 곳이 빨강),
 * 오른쪽은 반영될 글(새로 들어갈 곳이 초록)이고, 검토자가 한 글자 고칠 때마다 양쪽
 * 형광펜이 다시 칠해진다. **화면에 보이는 것이 곧 반영 버튼이 할 일이다.**
 *
 * 기준을 "지운 것이 있는가"로 바꾼 뒤로 검토에 올라오는 제안은 전부 무언가를 지우는
 * 편집이다. 검토자가 가장 먼저 봐야 할 것이 그것이라, 이 화면에서는 색이 본문보다 앞선다.
 */
export function ReviewMergeForm({
  currentBody,
  proposedBody,
  summary,
  approveAction,
  rejectAction,
}: Props) {
  /* 값의 주인은 textarea다. 여기 상태는 형광펜을 그리기 위한 사본일 뿐이다. */
  const [body, setBody] = useState(proposedBody);

  const ops = useMemo(() => diffWords(currentBody, body), [currentBody, body]);
  const stats = diffStats(ops);
  const removing = hasRemoval(ops);
  const edited = body !== proposedBody;

  return (
    <form className={styles.form}>
      <div className={styles.panes}>
        <section className={styles.pane}>
          <div className={styles.paneHead}>
            <span>현재 문서</span>
            <span className={`mono ${styles.count} ${removing ? styles.countRemove : ""}`}>
              {stats.removed > 0 ? `−${stats.removed}자 사라짐` : "지워지는 것 없음"}
            </span>
          </div>
          <DiffText ops={ops} side="before" className={styles.paneBody} />
        </section>

        <section className={styles.pane}>
          <div className={styles.paneHead}>
            <span>반영할 내용{edited ? " (고침)" : ""}</span>
            <span className={`mono ${styles.count} ${stats.added > 0 ? styles.countAdd : ""}`}>
              {stats.added > 0 ? `+${stats.added}자` : "더해지는 것 없음"}
            </span>
          </div>
          <HighlightedEditor
            name="body"
            defaultValue={proposedBody}
            ops={ops}
            onChange={setBody}
            maxLength={MAX_BODY_LENGTH}
            ariaLabel="반영할 내용"
            className={styles.editBox}
          />
        </section>
      </div>

      <p className={styles.hint}>
        오른쪽이 그대로 문서에 들어갑니다. 고쳐서 반영하려면 여기서 바로 고치세요.
        {summary && <span className={styles.summary}>제안자 요약: {summary}</span>}
      </p>

      <label className={styles.field}>
        <span className={styles.label}>검토 메모 (거절 시 필수, 사유를 남긴다)</span>
        <textarea name="reviewNote" className={styles.note} rows={3} />
      </label>

      {/*
        * 버튼 두 개가 한 폼을 공유하고 `formAction`으로 갈린다. 승인은 오른쪽 면의
        * 본문을, 거절은 검토 메모를 읽으므로 같은 폼 안에 있어야 한다.
        */}
      <div className={styles.actions}>
        <ActionButton action={approveAction} className="btn btn--acid">
          {edited ? "고쳐서 반영" : "그대로 반영"}
        </ActionButton>
        <ActionButton action={rejectAction} className="btn">
          거절
        </ActionButton>
      </div>
    </form>
  );
}

/** 제출 중에는 둘 다 잠근다. 승인과 거절이 겹쳐 눌리면 안 된다. */
function ActionButton({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => void;
  className: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" formAction={action} className={className} disabled={pending}>
      {pending ? "처리 중..." : children}
    </button>
  );
}
