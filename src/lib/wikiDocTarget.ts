/**
 * 문서 한 줄을 어떻게 부르고 어디로 보낼 것인가.
 *
 * 최근 변경·검토 대기열·내 편집·역사가 전부 "어느 문서의 어느 섹션인가"를 한 줄로
 * 적는다. 그 줄을 화면마다 따로 지으면 같은 문서를 화면마다 다르게 부르게 되고,
 * 일반 문서가 들어온 지금은 챔피언 슬러그가 없는 줄에서 조용히 빈칸이 난다.
 *
 * 그래서 이름·주소·섹션 이름을 **한 곳에서** 짓는다. D1이 돌려준 문서 식별 정보를
 * 그대로 받아, 화면은 결과만 쓴다.
 */

import { getChampionBySlug } from "@/data/champions";
import type { DocRef, DocTarget } from "@/data/wiki";
import { matchupDocTitle } from "@/lib/wikiLink";
import { articleHref } from "@/lib/wikiTitle";

/**
 * 문서의 정식 이름.
 *
 * 매치업 문서는 이름을 저장하지 않는다 — 챔피언 카탈로그가 갖고 있고, 챔피언당 문서가
 * 하나이므로 포지션이 이름에 들어가지 않는다 (마이그레이션 0003).
 */
export function docTitle(target: DocTarget): string {
  if (target.kind === "article") return target.title;
  return matchupDocTitle(getChampionBySlug(target.championSlug)?.name ?? target.championSlug);
}

/** 문서 주소. 섹션을 주면 그 자리까지 데려간다. */
export function docHref(target: DocTarget, meSlug?: string | null): string {
  if (target.kind === "article") return articleHref(target.title);
  return `/matchup/${target.championSlug}${meSlug ? `?me=${meSlug}` : ""}`;
}

/** 문서 역사 주소. */
export function docHistoryHref(target: DocTarget): string {
  return `${docHref(target)}/history`;
}

/**
 * 섹션 이름.
 *
 * 매치업 문서의 섹션 이름은 챔피언 카탈로그에서 되찾고(`me_slug`가 챔피언 슬러그다),
 * 일반 문서는 아직 본문 하나뿐이다. 이름 붙은 섹션은 3단계에서 들어온다.
 */
export function docSectionLabel(target: DocTarget, meSlug: string | null): string {
  if (!meSlug) return target.kind === "article" ? "본문" : "공통";
  return getChampionBySlug(meSlug)?.name ?? meSlug;
}

/** 화면이 서버 액션에 다시 실어 보낼 문서 참조. */
export function docRefOf(target: DocTarget): DocRef {
  return target.kind === "article"
    ? { kind: "article", titleKey: target.titleKey }
    : { kind: "matchup", championSlug: target.championSlug };
}
