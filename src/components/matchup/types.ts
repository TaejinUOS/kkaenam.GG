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
export type ChampionOption = { slug: string; name: string; iconUrl: string };
