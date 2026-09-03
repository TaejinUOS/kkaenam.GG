/**
 * 로그인·권한 확인 도우미.
 *
 * 페이지(Server Component)와 서버 액션은 실패 시 다르게 반응해야 한다 — 페이지는
 * 리다이렉트·404로 끝내면 되지만, 액션은 `useActionState`가 쓸 수 있는 값을
 * 돌려줘야 폼에 오류를 보여줄 수 있다. 그래서 두 갈래로 나눈다.
 *
 * 화면에서 편집 버튼이나 관리자 메뉴를 숨기는 것은 UX일 뿐이다. 실제 차단은
 * 여기 함수들이 서버에서 한다 (PRD 10 "인증 및 권한 검증은 서버에서 수행").
 */

import "server-only";

import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import type { UserRole } from "@/data/wiki";

export type Viewer = { id: string; name: string; role: UserRole };

export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "이름 없음",
    role: session.user.role ?? "member",
  };
}

/** 페이지에서 쓴다. 비로그인은 로그인 화면으로, 비관리자는 404로 보낸다. */
export async function requirePageAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "admin") notFound();
  return viewer;
}

/** 페이지에서 쓴다. 비로그인만 로그인 화면으로 보낸다. */
export async function requirePageUser(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export type ActionAuthResult =
  | { ok: true; viewer: Viewer }
  | { ok: false; error: "unauthenticated" | "forbidden" };

/** 서버 액션에서 쓴다. 실패해도 throw하지 않고 값으로 돌려줘 폼에서 처리할 수 있게 한다. */
export async function requireActionUser(): Promise<ActionAuthResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "unauthenticated" };
  return { ok: true, viewer };
}

export async function requireActionAdmin(): Promise<ActionAuthResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "unauthenticated" };
  if (viewer.role !== "admin") return { ok: false, error: "forbidden" };
  return { ok: true, viewer };
}
