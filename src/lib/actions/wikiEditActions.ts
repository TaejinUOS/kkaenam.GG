"use server";

/**
 * 위키 편집·검토 서버 액션. `useActionState`가 쓸 수 있는 typed 결과를 돌려준다
 * (throw하면 폼에서 오류를 보여줄 수 없다) — 인증 실패도 마찬가지다.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  MAX_BODY_LENGTH,
  MAX_SUMMARY_LENGTH,
  parseDocRef,
  type DocRef,
} from "@/data/wiki";
import { requireActionAdmin, requireActionUser } from "@/lib/authGuard";
import { TITLE_PROBLEM_MESSAGE, titleKey } from "@/lib/wikiTitle";
import {
  approveEdit,
  proposeArticle,
  rejectEdit,
  revertDoc,
  submitEdit,
} from "@/lib/wikiEditStore";

/** 저장 결과. `href`는 새 문서처럼 **돌아갈 곳이 저장 뒤에야 정해지는** 경우에만 온다. */
export type ActionState = { ok: boolean; message: string; href?: string } | null;

/**
 * 바뀐 문서와 그 문서를 담고 있는 목록들의 캐시를 버린다.
 *
 * 일반 문서는 주소가 이름이라 경로가 문서마다 다르다. 하나씩 지목하는 대신 그 구간을
 * 통째로 무르는 것은, 일반 문서가 몇 개 없는 지금 정확히 지목해서 얻는 것보다
 * "고쳤는데 옛 글이 보인다"를 막는 편이 크기 때문이다.
 */
function revalidateDoc(ref: DocRef) {
  if (ref.kind === "matchup") {
    revalidatePath(`/matchup/${ref.championSlug}`);
    revalidatePath(`/matchup/${ref.championSlug}/history`);
  } else {
    revalidatePath("/wiki/[title]", "page");
    revalidatePath("/wiki/[title]/history", "page");
  }
  revalidatePath("/wiki");
  revalidatePath("/wiki/recent");
  revalidatePath("/wiki/wanted");
  revalidatePath("/admin/wiki/review");
  revalidatePath("/admin/wiki/recent");
  revalidatePath("/my/edits");
}

export async function submitEditAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireActionUser();
  if (!auth.ok) return { ok: false, message: "로그인이 필요합니다." };

  const doc = parseDocRef(String(formData.get("doc") ?? ""));
  const meSlugRaw = String(formData.get("meSlug") ?? "");
  const meSlug = meSlugRaw ? meSlugRaw : null;
  const body = String(formData.get("body") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const patch = String(formData.get("patch") ?? "");

  if (!doc) return { ok: false, message: "잘못된 요청입니다." };
  if (body.length > MAX_BODY_LENGTH) {
    return { ok: false, message: `본문은 ${MAX_BODY_LENGTH}자를 넘을 수 없습니다.` };
  }
  if (summary.length > MAX_SUMMARY_LENGTH) {
    return { ok: false, message: `요약은 ${MAX_SUMMARY_LENGTH}자를 넘을 수 없습니다.` };
  }

  const result = await submitEdit({
    doc,
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
          : result.error === "not_found"
            ? "고칠 수 없는 문서입니다. 아직 승인되지 않았거나 사라진 문서일 수 있습니다."
            : "저장할 수 없는 내용입니다.",
    };
  }

  revalidateDoc(doc);

  return {
    ok: true,
    message:
      result.status === "accepted"
        ? "저장되어 문서에 바로 반영되었습니다."
        : "저장했습니다. 지운 부분이 있어 운영자 검토를 거쳐 반영되며, 진행 상황은 「내 편집」에서 볼 수 있습니다.",
  };
}

/**
 * 새 일반 문서 제안 (`docs/WIKI_EXPANSION.md` "새 문서 만들기").
 *
 * 이름이 겹치면 막다른 오류로 끝내지 않고 **그 문서의 주소를 함께 돌려준다.**
 * 목적지가 오류 화면보다 낫다.
 */
export async function proposeArticleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireActionUser();
  if (!auth.ok) return { ok: false, message: "로그인이 필요합니다." };

  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const patch = String(formData.get("patch") ?? "");

  const result = await proposeArticle({
    title,
    body,
    summary,
    authorId: auth.viewer.id,
    isAdmin: auth.viewer.role === "admin",
    patch,
  });

  if (!result.ok) {
    if (result.error === "taken") {
      const message =
        result.takenBy === "proposal"
          ? "누군가 먼저 제안했습니다. 그 제안이 검토를 기다리고 있습니다."
          : result.takenBy === "matchup"
            ? "이미 있는 매치업 문서의 이름입니다."
            : "이미 있는 문서입니다.";
      return { ok: false, message, href: result.href };
    }
    if (result.error === "rate_limited") {
      return { ok: false, message: "시간당 제출 상한을 넘었습니다. 잠시 후 다시 시도해 주세요." };
    }
    return {
      ok: false,
      message: result.problem
        ? TITLE_PROBLEM_MESSAGE[result.problem]
        : "본문을 적어야 문서를 만들 수 있습니다.",
    };
  }

  revalidateDoc({ kind: "article", titleKey: titleKey(title) });

  return {
    ok: true,
    href: result.href,
    message:
      result.status === "accepted"
        ? "문서를 만들었습니다."
        : "제안했습니다. 운영자가 승인하면 문서가 만들어지며, 진행 상황은 「내 편집」에서 볼 수 있습니다.",
  };
}

/**
 * 검토 상세 화면의 두 버튼(승인/거절)이 그대로 쓰는 plain form action이다.
 * `useActionState`를 쓰지 않으므로 Next 호출 규약(바인딩한 인자들 다음에 `formData`
 * 하나)을 그대로 따라야 한다 — 결과는 값으로 돌려주지 않고 리다이렉트로 알린다.
 */
export async function approveEditAction(
  editId: string,
  docRaw: string,
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

  const doc = parseDocRef(docRaw);
  if (doc) revalidateDoc(doc);

  redirect("/admin/wiki/review?done=approved");
}

export async function rejectEditAction(editId: string, formData: FormData): Promise<void> {
  const auth = await requireActionAdmin();
  if (!auth.ok) redirect(auth.error === "unauthenticated" ? "/login" : "/admin/wiki/review");

  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  if (!reviewNote) redirect(`/admin/wiki/review/${editId}?error=need_reason`);

  const result = await rejectEdit(editId, { reviewerId: auth.viewer.id, reviewNote });
  if (!result.ok) redirect(`/admin/wiki/review/${editId}?error=reject_failed`);

  /* 새 문서 제안을 거절하면 이름이 풀린다. 그 이름을 쥐고 있던 화면들도 함께 무른다. */
  revalidatePath("/wiki/[title]", "page");
  revalidatePath("/admin/wiki/review");
  revalidatePath("/my/edits");
  redirect("/admin/wiki/review?done=rejected");
}

/** `useActionState`용 액션. state/formData는 안 쓰지만 그 훅의 호출 규약상 자리는 있어야 한다. */
export async function revertDocAction(
  docRaw: string,
  targetRevision: number,
): Promise<ActionState> {
  const auth = await requireActionAdmin();
  if (!auth.ok) return { ok: false, message: "권한이 없습니다." };

  const doc = parseDocRef(docRaw);
  if (!doc) return { ok: false, message: "잘못된 요청입니다." };

  const result = await revertDoc(doc, targetRevision, auth.viewer.id);
  if (!result.ok) return { ok: false, message: "되돌릴 수 없습니다." };
  if (result.changedSections === 0) return { ok: true, message: "이미 그 상태와 같습니다." };

  revalidateDoc(doc);

  return { ok: true, message: `되돌렸습니다 (섹션 ${result.changedSections}개 변경).` };
}
