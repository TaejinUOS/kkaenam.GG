/**
 * 상대 시각 표기.
 *
 * 최근 변경 피드가 "3시간 · 정글 동선 › 갱킹"처럼 읽혀야 하는데, 절대 시각은 그 자리에서
 * 두 번 계산해야 읽힌다 ("지금 몇 시더라"). 피드의 일은 순서를 보여 주는 것이지 시각을
 * 기록하는 것이 아니므로 상대 시각을 쓴다. 정확한 시각은 `<time dateTime>`에 남는다.
 *
 * **반드시 서버에서 지어 화면에 문자열로 넘긴다.** 클라이언트에서 계산하면 서버가 그린
 * HTML과 첫 렌더가 어긋나 수화 경고가 난다.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diff = now - then;
  /* 시계가 조금 어긋난 서버가 미래 시각을 줄 수 있다. 음수는 "방금"으로 접는다. */
  if (diff < MINUTE) return "방금";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간`;
  if (diff < 2 * DAY) return "어제";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(then));
}
