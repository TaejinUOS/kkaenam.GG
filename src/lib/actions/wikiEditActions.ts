"use server";

/**
 * 위키 편집·검토 서버 액션. `useActionState`가 쓸 수 있는 typed 결과를 돌려준다
 * (throw하면 폼에서 오류를 보여줄 수 없다) — 인증 실패도 마찬가지다.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MAX_BODY_LENGTH, MAX_SUMMARY_LENGTH } from "@/data/wiki";
import { requireActionAdmin, requireActionUser } from "@/lib/authGuard";
import {
  approveEdit,
  rejectEdit,
  revertDoc,
  submitEdit,
} from "@/lib/wikiEditStore";

export type ActionState = { ok: boolean; message: string } | null;

function matchupPath(positionSlug: string, championSlug: string) {
  return `/matchup/${positionSlug}/${championSlug}`;
}

export async function submitEditAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireActionUser();
  if (!auth.ok) return { ok: false, message: "로그인이 필요합니다." };

  const positionSlug = String(formData.get("positionSlug") ?? "");
  const championSlug = String(formData.get("championSlug") ?? "");
  const meSlugRaw = String(formData.get("meSlug") ?? "");
  const meSlug = meSlugRaw ? meSlugRaw : null;
  const body = String(formData.get("body") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const patch = String(formData.get("patch") ?? "");

  if (!positionSlug || !championSlug) return { ok: false, message: "잘못된 요청입니다." };
  if (body.length > MAX_BODY_LENGTH) {
    return { ok: false, message: `본문은 ${MAX_BODY_LENGTH}자를 넘을 수 없습니다.` };
  }
  if (summary.length > MAX_SUMMARY_LENGTH) {
    return { ok: false, message: `요약은 ${MAX_SUMMARY_LENGTH}자를 넘을 수 없습니다.` };
  }

  const result = await submitEdit({
    positionSlug,
    championSlug,
    meSlug,
    body,
    summary,
    authorId: auth.viewer.id,
    isAdmin: auth.viewer.role === "admin",
    patch,
  });

  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error === "rate_limited"
          ? "시간당 편집 제출 상한을 넘었습니다. 잠시 후 다시 시도해 주세요."
          : "저장할 수 없는 내용입니다.",
    };
  }

  revalidatePath(matchupPath(positionSlug, championSlug));
  revalidatePath(`${matchupPath(positionSlug, championSlug)}/history`);
  revalidatePath("/admin/wiki/review");
  revalidatePath("/admin/wiki/recent");
  revalidatePath("/my/edits");

  return {
    ok: true,
    message: result.status === "accepted" ? "저장되어 바로 반영되었습니다." : "저장되었습니다. 운영자 검토 후 반영됩니다.",
  };
}

/**
 * 검토 상세 화면의 두 버튼(승인/거절)이 그대로 쓰는 plain form action이다.
 * `useActionState`를 쓰지 않으므로 Next 호출 규약(바인딩한 인자들 다음에 `formData`
 * 하나)을 그대로 따라야 한다 — 결과는 값으로 돌려주지 않고 리다이렉트로 알린다.
 */
export async function approveEditAction(
  editId: string,
  positionSlug: string,
  championSlug: string,
  formData: FormData,
): Promise<void> {
  const auth = await requireActionAdmin();
  if (!auth.ok) redirect(auth.error === "unauthenticated" ? "/login" : "/admin/wiki/review");

  const body = String(formData.get("body") ?? "");
  const reviewNoteRaw = String(formData.get("reviewNote") ?? "").trim();

  const result = await approveEdit(editId, {
    reviewerId: auth.viewer.id,
    body,
    reviewNote: reviewNoteRaw || null,
  });

  if (!result.ok) redirect(`/admin/wiki/review/${editId}?error=approve_failed`);

  revalidatePath(matchupPath(positionSlug, championSlug));
  revalidatePath(`${matchupPath(positionSlug, championSlug)}/history`);
  revalidatePath("/admin/wiki/recent");
  revalidatePath("/my/edits");

  redirect("/admin/wiki/review?done=approved");
}

export async function rejectEditAction(editId: string, formData: FormData): Promise<void> {
  const auth = await requireActionAdmin();
  if (!auth.ok) redirect(auth.error === "unauthenticated" ? "/login" : "/admin/wiki/review");

  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  if (!reviewNote) redirect(`/admin/wiki/review/${editId}?error=need_reason`);

  const result = await rejectEdit(editId, { reviewerId: auth.viewer.id, reviewNote });
  if (!result.ok) redirect(`/admin/wiki/review/${editId}?error=reject_failed`);

  revalidatePath("/my/edits");
  redirect("/admin/wiki/review?done=rejected");
}

/** `useActionState`용 액션. state/formData는 안 쓰지만 그 훅의 호출 규약상 자리는 있어야 한다. */
export async function revertDocAction(
  positionSlug: string,
  championSlug: string,
  targetRevision: number,
): Promise<ActionState> {
  const auth = await requireActionAdmin();
  if (!auth.ok) return { ok: false, message: "권한이 없습니다." };

  const result = await revertDoc(positionSlug, championSlug, targetRevision, auth.viewer.id);
  if (!result.ok) return { ok: false, message: "되돌릴 수 없습니다." };
  if (result.changedSections === 0) return { ok: true, message: "이미 그 상태와 같습니다." };

  revalidatePath(matchupPath(positionSlug, championSlug));
  revalidatePath(`${matchupPath(positionSlug, championSlug)}/history`);
  revalidatePath("/admin/wiki/recent");

  return { ok: true, message: `되돌렸습니다 (섹션 ${result.changedSections}개 변경).` };
}
