/**
 * 한국어 조사 선택.
 *
 * 챔피언·포지션 이름이 데이터에서 오기 때문에 조사를 문구에 붙여 둘 수 없다.
 * 미드에는 받침 있는 이름(탈론, 르블랑, 사이온)과 없는 이름(아리, 제드)이 섞여 있어,
 * 고정하면 "탈론로 상대할 때", "탈론를 상대하는"처럼 어색한 문장이 나온다.
 */

/**
 * 마지막 글자의 종성 인덱스. 한글 음절이 아니면 null.
 * 한글 음절은 (초성 × 21 + 중성) × 28 + 종성 순으로 배열돼 있어 28로 나눈 나머지가 종성이다.
 */
function finalConsonant(word: string): number | null {
  const last = word.trim().slice(-1);
  if (!last) return null;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28;
}

/** 받침이 있으면 `을`, 없으면 `를`. */
export function eulReul(word: string): string {
  const jong = finalConsonant(word);
  // 한글이 아닌 이름(영문·숫자)은 판정할 수 없어 더 흔한 쪽으로 둔다.
  if (jong === null) return "를";
  return jong === 0 ? "를" : "을";
}

/** 받침이 있으면 `은`, 없으면 `는`. */
export function eunNeun(word: string): string {
  const jong = finalConsonant(word);
  if (jong === null) return "는";
  return jong === 0 ? "는" : "은";
}

/**
 * 받침이 없거나 `ㄹ` 받침이면 `로`, 그 밖에는 `으로`.
 * `ㄹ`이 예외라 정글 → 정글로, 탈론 → 탈론으로가 된다.
 */
export function ro(word: string): string {
  const jong = finalConsonant(word);
  if (jong === null) return "로";
  const RIEUL = 8;
  return jong === 0 || jong === RIEUL ? "로" : "으로";
}
