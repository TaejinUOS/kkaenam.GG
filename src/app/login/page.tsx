import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "로그인" };

/**
 * `callbackUrl`이 있으면 로그인 뒤 그 경로로 돌아간다. 편집 버튼처럼 로그인이
 * 필요한 곳에서 원래 화면으로 이어 붙이는 데 쓴다 (PRD 흐름 B 2단계).
 * 같은 오리진의 상대 경로만 신뢰한다 — 다른 도메인으로 열린 리다이렉트를 막는다.
 */
function safeCallbackUrl(raw: string | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const callbackParam = (await searchParams).callbackUrl;
  const redirectTo = safeCallbackUrl(typeof callbackParam === "string" ? callbackParam : undefined);

  if (session) redirect(redirectTo);

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
            await signIn("google", { redirectTo });
          }}
        >
          <button className={`btn btn--acid ${styles.providerBtn}`} type="submit">
            구글로 로그인
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("kakao", { redirectTo });
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
