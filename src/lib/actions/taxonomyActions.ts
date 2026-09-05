"use server";

/**
 * 운영 분류 편집 서버 액션 (PRD 3.1-6).
 *
 * 평범한 form action이다. `useActionState`를 쓰지 않으므로 결과는 값이 아니라
 * 리다이렉트로 알린다 — 배치 하나를 옮기는 조작에 클라이언트 상태를 둘 값이 없다.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActionAdmin } from "@/lib/authGuard";
import {
  moveChampion,
  placeChampion,
  setChampionActive,
  unplaceChampion,
} from "@/lib/taxonomyStore";

/**
 * 배치가 바뀌면 다시 그려야 하는 화면들.
 *
 * 문서 화면(`/matchup/...`)은 넣지 않는다. **배치는 문서를 건드리지 않는다** —
 * 이동 경로 표시가 다음 방문에 갱신되면 그만이고, 문서 수가 200을 넘으면 전부
 * 무효화하는 비용이 커진다.
 */
function revalidateTaxonomy(positionSlug: string) {
  revalidatePath("/");
  revalidatePath("/wiki");
  revalidatePath("/wiki/wanted");
  revalidatePath("/admin/taxonomy");
  return `/admin/taxonomy?position=${positionSlug}`;
}

export async function placeChampionAction(formData: FormData): Promise<void> {
  const auth = await requireActionAdmin();
  if (!auth.ok) redirect(auth.error === "unauthenticated" ? "/login" : "/");

  const positionSlug = String(formData.get("positionSlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const championSlug = String(formData.get("championSlug") ?? "");

  const result = await placeChampion(positionSlug, categorySlug, championSlug, auth.viewer.id);
  const back = revalidateTaxonomy(positionSlug);
  redirect(result.ok ? `${back}&done=placed` : `${back}&error=invalid`);
}

export async function unplaceChampionAction(formData: FormData): Promise<void> {
  const auth = await requireActionAdmin();
  if (!auth.ok) redirect(auth.error === "unauthenticated" ? "/login" : "/");

  const positionSlug = String(formData.get("positionSlug") ?? "");
  const championSlug = String(formData.get("championSlug") ?? "");

  await unplaceChampion(positionSlug, championSlug);
  redirect(`${revalidateTaxonomy(positionSlug)}&done=removed`);
}

/** 카테고리 안에서 한 칸 옮긴다 (FR-38). */
export async function moveChampionAction(formData: FormData): Promise<void> {
  const auth = await requireActionAdmin();
  if (!auth.ok) redirect(auth.error === "unauthenticated" ? "/login" : "/");

  const positionSlug = String(formData.get("positionSlug") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const championSlug = String(formData.get("championSlug") ?? "");
  const direction = String(formData.get("direction") ?? "") === "up" ? "up" : "down";

  const result = await moveChampion(
    positionSlug,
    categorySlug,
    championSlug,
    direction,
    auth.viewer.id,
  );
  const back = revalidateTaxonomy(positionSlug);
  /*
   * 순서를 바꾼 뒤에는 `done` 문구를 붙이지 않는다. 결과가 바로 눈앞의 목록에
   * 보이므로, 한 칸 옮길 때마다 안내 줄이 뜨면 그게 더 시끄럽다.
   */
  redirect(result.ok ? back : `${back}&error=invalid`);
}

/**
 * 챔피언을 내리거나 올린다 (FR-39).
 *
 * 내려도 문서는 그대로다. 이 조작이 바꾸는 것은 **찾는 길**뿐이라, 안내 문구도
 * 그렇게 적는다 — 운영자가 "글이 지워졌나" 하고 확인하러 가지 않아도 되게.
 */
export async function setChampionActiveAction(formData: FormData): Promise<void> {
  const auth = await requireActionAdmin();
  if (!auth.ok) redirect(auth.error === "unauthenticated" ? "/login" : "/");

  const positionSlug = String(formData.get("positionSlug") ?? "");
  const championSlug = String(formData.get("championSlug") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  const note = String(formData.get("note") ?? "").trim();

  const result = await setChampionActive(championSlug, active, note || null, auth.viewer.id);
  const back = revalidateTaxonomy(positionSlug);
  if (!result.ok) redirect(`${back}&error=invalid`);
  redirect(`${back}&done=${active ? "activated" : "deactivated"}`);
}
