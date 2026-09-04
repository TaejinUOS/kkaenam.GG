import type { SkillSlot } from "@/data/types";

export type SkillView = {
  slot: SkillSlot;
  name: string;
  description: string;
  cooldown: string | null;
  cost: string | null;
  costType: string;
  range: string | null;
  iconUrl: string;
};

export type ChampionView = {
  slug: string;
  name: string;
  title: string;
  iconUrl: string;
  illustrationUrl: string;
  focus: string;
  spells: SkillView[];
};

export type PositionView = { slug: string; name: string; code: string };
export type CategoryView = { slug: string; name: string };

/**
 * 챔피언이 놓인 자리 하나.
 *
 * 문서는 챔피언당 하나지만(마이그레이션 0003) 그 챔피언은 여러 포지션에 있을 수 있다
 * (럭스: 미드·원딜·서폿). 화면은 이 목록으로 이동 경로를 그린다.
 */
export type PlacementView = { position: PositionView; category: CategoryView };
export type ChampionOption = { slug: string; name: string; iconUrl: string };
