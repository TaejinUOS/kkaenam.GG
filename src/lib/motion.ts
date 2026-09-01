/** 애니메이션 감소 설정 확인. 서버 렌더링 중에는 항상 false를 돌려준다. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 포인터 호버를 지원하는 정밀 포인터 환경인지 (블루프린트 8장). */
export function hasFinePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
