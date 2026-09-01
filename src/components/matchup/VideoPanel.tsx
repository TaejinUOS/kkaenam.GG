import styles from "./VideoPanel.module.css";
import type { ChampionView, PositionView } from "./types";

/**
 * 영상 탭.
 *
 * PRD 5.3.2는 '롤깨남' 채널의 상대법 영상을 Embed로 "추가할 예정"이라고만 정했고,
 * 출처·임베드 허용 범위·검수 주체는 PRD 15의 미결정 사항 8번으로 남아 있다.
 * PRD 3.2가 가짜 데이터를 금지하므로 임시 썸네일을 만들지 않고 빈 상태만 제공한다.
 * 목록 조판은 블루프린트 6.4의 2열 구성을 그대로 따르도록 준비해 둔다.
 */
export function VideoPanel({
  champion,
  position,
}: {
  champion: ChampionView;
  position: PositionView;
}) {
  return (
    <div className={styles.panel}>
      <p className="section-index">영상 / 운영자 선별</p>

      <div className={styles.empty}>
        <p className={styles.title}>
          {position.name} {champion.name} 상대법 영상을 준비하고 있습니다.
        </p>
        <p className={styles.body}>
          &lsquo;롤깨남&rsquo; 채널의 상대법 영상을 운영자가 검수해 등록할 예정입니다. 등록 전까지는
          게시판의 Tip이 가장 최신 상대법입니다.
        </p>
        <p className={`mono ${styles.note}`}>
          영상 출처와 임베드 범위는 확정 후 공개합니다.
        </p>
      </div>

      {/* 등록 전까지 자리만 잡아 두는 2열 골격. 가짜 썸네일은 넣지 않는다. */}
      <ul className={styles.skeleton} aria-hidden="true">
        <li />
        <li />
      </ul>
    </div>
  );
}
