/**
 * Tip 로컬 저장소 — 서버 API가 붙기 전까지의 임시 구현.
 *
 * PRD 15 미결정 사항 1번(회원가입 방식)이 정해지기 전에는 실제 인증과 서버 저장을 만들 수 없다.
 * 그래서 작성·수정·삭제·평가 흐름(PRD 5.4, FR-14/15/17)을 브라우저 localStorage에 저장해
 * 화면 흐름을 그대로 검증할 수 있게 해 두고, 화면에는 로컬 데모 계정임을 분명히 표시한다.
 *
 * 서버가 붙으면 이 파일의 함수 시그니처를 유지한 채 fetch 호출로 교체하면 된다.
 * 권한 검증은 화면 표시와 별개로 서버에서 수행해야 한다 (PRD 10 보안 및 운영).
 */

import type { MeBlock, Tip } from "@/data/types";

const TIPS_KEY = "kkaenam.tips.v1";
const VOTES_KEY = "kkaenam.votes.v1";
const USER_KEY = "kkaenam.user.v1";

export type Vote = "like" | "dislike";
export type VoteMap = Record<string, Vote>;

export type LocalUser = {
  id: string;
  name: string;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // 사생활 보호 모드나 저장 공간 차단 환경에서는 조용히 기본값으로 동작한다.
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장에 실패해도 화면 동작은 막지 않는다. */
  }
}

/* --------------------------------------------------------------- 로컬 계정 */

export function loadUser(): LocalUser | null {
  return read<LocalUser | null>(USER_KEY, null);
}

export function signIn(name: string): LocalUser {
  const user: LocalUser = {
    id: `local-${Math.random().toString(36).slice(2, 10)}`,
    name: name.trim() || "이름 없는 소환사",
  };
  write(USER_KEY, user);
  return user;
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* noop */
  }
}

/* ------------------------------------------------------------- 사용자 Tip */

export function loadUserTips(): Tip[] {
  return read<Tip[]>(TIPS_KEY, []);
}

export function saveUserTip(tip: Tip): void {
  const tips = loadUserTips();
  const index = tips.findIndex((t) => t.id === tip.id);
  if (index >= 0) tips[index] = tip;
  else tips.unshift(tip);
  write(TIPS_KEY, tips);
}

export function deleteUserTip(id: string): void {
  write(
    TIPS_KEY,
    loadUserTips().filter((t) => t.id !== id),
  );
}

export function getUserTip(id: string): Tip | undefined {
  return loadUserTips().find((t) => t.id === id);
}

export function newTipId(): string {
  return `local-tip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function newMeBlockId(): string {
  return `local-me-${Math.random().toString(36).slice(2, 10)}`;
}

/* ----------------------------------------------------------------- 평가 */

export function loadVotes(): VoteMap {
  return read<VoteMap>(VOTES_KEY, {});
}

/** 좋아요·싫어요는 하나만 선택되며, 같은 값을 다시 누르면 취소된다 (PRD FR-15). */
export function toggleVote(tipId: string, vote: Vote): VoteMap {
  const votes = loadVotes();
  if (votes[tipId] === vote) delete votes[tipId];
  else votes[tipId] = vote;
  write(VOTES_KEY, votes);
  return votes;
}

/* ------------------------------------------------------------------ 병합 */

/** 시드 Tip과 로컬 작성 Tip을 합친다. 같은 id는 로컬 값이 우선한다. */
export function mergeTips(seed: Tip[], local: Tip[]): Tip[] {
  const byId = new Map(seed.map((t) => [t.id, t]));
  for (const tip of local) byId.set(tip.id, tip);
  return [...byId.values()];
}

/** 로컬 평가를 반영한 표시용 좋아요·싫어요 수. */
export function applyVotes(tip: Tip, votes: VoteMap) {
  const vote = votes[tip.id];
  return {
    vote: vote ?? null,
    likes: tip.likes + (vote === "like" ? 1 : 0),
    dislikes: tip.dislikes + (vote === "dislike" ? 1 : 0),
  };
}

/** 기본 정렬: 좋아요 내림차순, 동률이면 최신 작성순 (PRD 5.3.3, FR-11). */
export function sortTips(tips: Tip[], votes: VoteMap, sort: "likes" | "recent"): Tip[] {
  return [...tips].sort((a, b) => {
    if (sort === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    const byLikes = applyVotes(b, votes).likes - applyVotes(a, votes).likes;
    if (byLikes !== 0) return byLikes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/** 선택한 내 챔피언에 해당하는 Me 블록만 (PRD 5.3.3, FR-13). */
export function meBlockFor(tip: Tip, meSlug: string | null): MeBlock | null {
  if (!meSlug) return null;
  return tip.meBlocks.find((b) => b.championSlug === meSlug) ?? null;
}
