import Link from "next/link";

import { MarkdownBody } from "@/components/wiki/MarkdownBody";
import { RevertButton } from "@/components/wiki/RevertButton";
import { ACCEPTED_VIA_LABEL, encodeDocRef, isUnreviewed, type DocTarget } from "@/data/wiki";
import { docHref, docRefOf, docSectionLabel, docTitle } from "@/lib/wikiDocTarget";
import { getHistoryEntryBody, type HistoryRow } from "@/lib/wikiEditStore";
import { resolveWikiTitle } from "@/lib/wikiLink";

import styles from "./DocHistoryView.module.css";

type Props = {
  target: DocTarget;
  history: HistoryRow[];
  /** 되돌리기는 관리자만 볼 수 있다 (FR-30). */
  isAdmin: boolean;
};

/**
 * 문서 역사 (FR-29). 매치업 문서와 일반 문서가 같은 화면을 쓴다.
 *
 * 역사는 문서 종류를 묻지 않는다 — `wiki_edits`가 섹션 단위로 돌아가고 승인된 행이
 * 곧 리비전이기 때문이다. 다른 것은 문서를 부르는 이름과 섹션 이름뿐이고, 그 둘은
 * `wikiDocTarget.ts`가 짓는다.
 */
export function DocHistoryView({ target, history, isAdmin }: Props) {
  const docRef = encodeDocRef(docRefOf(target));

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">문서 역사</p>
      <h1 className={`display ${styles.title}`}>{docTitle(target)}</h1>
      <Link href={docHref(target)} className={styles.back}>
        문서로 돌아가기
      </Link>

      {history.length === 0 ? (
        <p className={styles.empty}>아직 반영된 편집이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {history.map((entry) => (
            <li key={entry.id} className={styles.row}>
              <details>
                <summary className={styles.summary}>
                  <span className="mono">r{entry.revision}</span>
                  <span className="sticker">{docSectionLabel(target, entry.meSlug)}</span>
                  <span
                    className={`sticker ${isUnreviewed(entry.acceptedVia) ? "sticker--gum" : "sticker--acid"}`}
                  >
                    {ACCEPTED_VIA_LABEL[entry.acceptedVia] ?? entry.acceptedVia}
                  </span>
                  <span>{entry.summary || "(요약 없음)"}</span>
                  <span className="mono">
                    {entry.authorName ?? "탈퇴 계정"} · {formatDate(entry.createdAt)}
                  </span>
                </summary>
                <div className={styles.detailBody}>
                  <HistoryBody editId={entry.id} />
                  {isAdmin && <RevertButton doc={docRef} targetRevision={entry.revision} />}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 그 리비전의 본문.
 *
 * 링크는 카탈로그만으로 풀리는 매치업 갈래까지만 해석한다. 일반 문서까지 풀려면
 * 역사 항목마다 조회가 하나씩 붙는데, 역사는 그때 적힌 글자를 확인하는 자리라 그만한
 * 값이 없다 — 없는 이름은 빨간 링크로 남는다.
 */
async function HistoryBody({ editId }: { editId: string }) {
  const body = await getHistoryEntryBody(editId);
  return (
    <div className={styles.body}>
      <MarkdownBody text={body || "(비어 있음)"} resolveLink={resolveWikiTitle} />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
