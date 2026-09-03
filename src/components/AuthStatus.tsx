import Link from "next/link";

import { auth, signOut } from "@/auth";

import styles from "./AuthStatus.module.css";

/**
 * 헤더의 로그인 상태 표시 (PRD FR-22). 서버 컴포넌트라 `layout.tsx`가
 * `SiteHeader`(클라이언트 컴포넌트)의 `children`으로 내려준다.
 */
export async function AuthStatus() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className={styles.wrap}>
        <Link className={styles.login} href="/login">
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.name}>{session.user.name ?? "회원"}</span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className={styles.signOut} type="submit">
          로그아웃
        </button>
      </form>
    </div>
  );
}
