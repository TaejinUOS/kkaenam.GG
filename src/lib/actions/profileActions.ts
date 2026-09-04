"use server";

/**
 * 마이페이지 서버 액션.
 *
 * 닉네임 변경은 `useActionState`가 쓸 수 있는 값을 돌려준다 — 거절 사유("이미 쓰이는
 * 닉네임입니다")를 입력 칸 옆에 그대로 보여 줘야 하기 때문이다.
 * 탈퇴는 돌아올 화면이 없으므로 리다이렉트로 끝낸다.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { requireActionUser } from "@/lib/authGuard";
import { deleteUser, getProfile, renameUser } from "@/lib/userStore";

export type ProfileState = { ok: boolean; message: string } | null;

export async function renameAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const auth = await requireActionUser();
  if (!auth.ok) return { ok: false, message: "로그인이 필요합니다." };

  const result = await renameUser(auth.viewer.id, String(formData.get("name") ?? ""));
  if (!result.ok) return { ok: false, message: result.reason };

  /*
   * 이름은 조회 시점에 users를 조인해 나오므로, 바뀌면 이 사람이 남긴 편집이 보이는
   * 화면이 전부 옛 이름을 들고 있다. 그 목록들을 함께 무효화한다.
   */
  revalidatePath("/my");
  revalidatePath("/my/edits");
  revalidatePath("/wiki/recent");
  revalidatePath("/admin/wiki/recent");
  revalidatePath("/admin/wiki/review");

  return { ok: true, message: "닉네임을 바꿨습니다. 지난 편집에 표시되는 이름도 함께 바뀝니다." };
}

/**
 * 회원 탈퇴 (개인정보처리방침 7항).
 *
 * 되돌릴 수 없으므로 **지금 쓰는 닉네임을 정확히 입력해야** 진행한다. 버튼 하나로
 * 계정이 사라지면, 누른 사람이 무엇을 눌렀는지 모른 채 사라진다.
 */
export async function deleteAccountAction(formData: FormData): Promise<void> {
  const auth = await requireActionUser();
  if (!auth.ok) redirect("/login");

  const profile = await getProfile(auth.viewer.id);
  if (!profile) redirect("/");

  /*
   * 운영자는 스스로 탈퇴할 수 없다. 마지막 운영자가 나가면 검토 대기열을 볼 사람이
   * 없어지고, 그 상태는 화면 어디에도 드러나지 않는다. 권한을 넘긴 뒤에 나가야 한다.
   */
  if (profile.role === "admin") redirect("/my?error=admin_cannot_leave");

  const typed = String(formData.get("confirm") ?? "").trim();
  if (typed !== profile.name) redirect("/my?error=confirm_mismatch");

  await deleteUser(auth.viewer.id);

  revalidatePath("/wiki/recent");
  revalidatePath("/admin/wiki/recent");

  /* 세션까지 끊어야 탈퇴가 끝난다. 남아 있으면 없는 계정으로 로그인한 상태가 된다. */
  await signOut({ redirectTo: "/?left=1" });
}
