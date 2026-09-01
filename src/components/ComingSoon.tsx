import Link from "next/link";

import styles from "./ComingSoon.module.css";

/**
 * 공통 `추후 개발` 안내 화면 (PRD 5.6, 블루프린트 6.5).
 *
 * 메뉴명, 준비 중이라는 설명, `상대법으로 돌아가기` 동작만 제공한다.
 * 구현된 것처럼 보이는 검색창, 통계 수치, 차트, 티어 카드는 배치하지 않는다.
 */
export function ComingSoon({
  name,
  index,
  description,
}: {
  name: string;
  /** 잡지 목차처럼 노출하는 화면 번호. */
  index: string;
  description: string;
}) {
  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">{index} / 준비 중</p>

      <h1 className={`display ${styles.name}`}>{name}</h1>

      <p className={`sticker sticker--acid ${styles.badge}`}>추후 개발 / coming soon</p>

      <p className={styles.description}>{description}</p>

      <Link className="btn btn--acid" href="/">
        상대법으로 돌아가기
      </Link>
    </div>
  );
}
