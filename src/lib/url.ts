/** URL 질의 문자열 헬퍼. 화면 상태를 URL에 반영하는 규칙을 한곳에 모은다. */

/** 값이 비었거나 기본값과 같으면 키를 제거해 URL을 짧게 유지한다. */
export function buildQuery(
  base: URLSearchParams | string,
  patch: Record<string, string | null | undefined>,
): string {
  const params = new URLSearchParams(base);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** 검색어 정규화. 대소문자와 앞뒤 공백에 관계없이 일치시킨다 (PRD FR-05). */
export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

/** 한글·영문 이름 어느 쪽으로 검색해도 걸리도록 두 필드를 함께 본다. */
export function matchesName(needle: string, ...haystacks: string[]): boolean {
  if (!needle) return true;
  return haystacks.some((h) => h.toLowerCase().replace(/\s+/g, "").includes(needle.replace(/\s+/g, "")));
}
