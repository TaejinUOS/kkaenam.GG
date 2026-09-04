/**
 * 닉네임 규칙.
 *
 * DB를 쓰지 않는 순수 문자열 판정이라 `userStore.ts`에서 떼어 냈다. 서버 전용이 아니므로
 * 나중에 입력 칸에서 즉시 검사에 쓸 수도 있다 — 다만 **판정의 근거는 언제나 저장 시점의
 * 서버 호출**이고, 화면 검사는 편의일 뿐이다.
 */

/** 닉네임 최소·최대 길이. 한 글자는 사람을 구별하지 못하고, 스무 자를 넘으면 목록이 깨진다. */
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 20;

/** 닉네임을 다시 바꾸기까지 기다려야 하는 날. */
export const NAME_CHANGE_COOLDOWN_DAYS = 30;

/**
 * 운영자를 사칭하는 이름은 막는다.
 *
 * 이 사이트에서 이름은 편집 기록 옆에 남는 유일한 신원 표시라, `운영자`라고 적힌
 * 이름이 남긴 편집은 실제 운영자의 판단처럼 읽힌다.
 *
 * **직함은 부분 일치로 막는다.** `부운영자`도 운영진처럼 읽히기 때문이다.
 */
const RESERVED_CONTAINS = ["운영자", "관리자", "administrator", "admin"];

/**
 * 사이트 자신과 시스템 계정의 이름. **정확히 같을 때만 막는다.**
 *
 * 부분 일치로 막으면 `롤깨남`·`깨남러`처럼 사이트 이름을 넣은 평범한 닉네임이 전부
 * 걸린다. 그건 사칭이 아니라 애칭이다. 막아야 하는 것은 사이트나 시스템 계정 **행세**를
 * 하는 이름, 즉 이름이 그것과 똑같은 경우뿐이다.
 */
const RESERVED_EXACT = ["깨남", "깨남.com", "깨남.gg", "kkaenam", "kkaenam.com"];

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

/**
 * 닉네임을 다듬고 검사한다. **저장 직전에 서버에서 부른다** — 화면의 검사는 편의일 뿐이다.
 *
 * 앞뒤 공백을 버리고 연속 공백을 하나로 줄인다. `홍  길동`과 `홍 길동`이 다른 사람으로
 * 보이면 안 되고, 보이지 않는 문자로 남을 흉내 내는 이름도 막아야 한다.
 */
export function normalizeName(raw: string): NameCheck {
  /* 제어 문자와 눈에 보이지 않는 공백류를 먼저 걷어낸다. */
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2060\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < MIN_NAME_LENGTH) {
    return { ok: false, reason: `닉네임은 ${MIN_NAME_LENGTH}자 이상이어야 합니다.` };
  }
  if (cleaned.length > MAX_NAME_LENGTH) {
    return { ok: false, reason: `닉네임은 ${MAX_NAME_LENGTH}자를 넘을 수 없습니다.` };
  }
  const folded = cleaned.toLowerCase().replace(/\s/g, "");
  if (RESERVED_CONTAINS.some((word) => folded.includes(word))) {
    return { ok: false, reason: "운영자로 오해할 수 있는 낱말은 쓸 수 없습니다." };
  }
  if (RESERVED_EXACT.includes(folded)) {
    return { ok: false, reason: "사이트 이름과 똑같은 닉네임은 쓸 수 없습니다." };
  }
  return { ok: true, name: cleaned };
}
