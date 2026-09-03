import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">로그인</p>
      <h1 className={`display ${styles.title}`}>로그인</h1>
      <p className={styles.description}>
        구글 또는 카카오 계정으로 로그인합니다. 별도의 아이디·비밀번호 회원가입은 받지
        않습니다.
      </p>

      <div className={styles.providers}>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button className={`btn btn--acid ${styles.providerBtn}`} type="submit">
            구글로 로그인
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("kakao", { redirectTo: "/" });
          }}
        >
          <button className={`btn ${styles.providerBtn}`} type="submit">
            카카오로 로그인
          </button>
        </form>
      </div>

      <Link className={`btn btn--ghost ${styles.back}`} href="/">
        상대법으로 돌아가기
      </Link>
    </div>
  );
}
