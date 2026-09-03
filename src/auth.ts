/**
 * Auth.js 설정 루트.
 *
 * Cloudflare Workers는 요청마다 `process.env`가 안정적으로 채워지는 환경이 아니므로,
 * 프로바이더 키는 `getCloudflareContext()`의 바인딩에서 읽어 lazy init 함수 안에서
 * 구성한다 (모듈 최상단에서 `process.env`에 의존하지 않는다).
 *
 * 세션 전략은 JWT다. Auth.js 공식 D1 어댑터는 이 스택(@opennextjs/cloudflare)에서
 * 알려진 버그가 있어(opennextjs/opennextjs-cloudflare#435) Adapter 인터페이스를 쓰지
 * 않는다. 대신 `jwt` 콜백에서 `userStore.ts`로 D1에 직접 upsert한다.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";

import { upsertUser } from "@/lib/userStore";

const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const { env } = await getCloudflareContext({ async: true });

  return {
    secret: env.AUTH_SECRET,
    trustHost: true,
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    providers: [
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
      Kakao({
        clientId: env.AUTH_KAKAO_ID,
        clientSecret: env.AUTH_KAKAO_SECRET,
      }),
    ],
    callbacks: {
      // `account`는 로그인 시점에만 채워진다. 세션 유지 중 재호출에는 없으므로
      // D1 upsert는 로그인 1회에만 일어난다.
      async jwt({ token, account, user }) {
        if (account && (account.provider === "google" || account.provider === "kakao")) {
          const record = await upsertUser({
            provider: account.provider,
            providerId: account.providerAccountId,
            name: user?.name ?? "이름 없음",
            email: user?.email ?? null,
          });
          token.uid = record.id;
          token.role = record.role;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.uid ?? "";
          session.user.role = token.role ?? "member";
        }
        return session;
      },
    },
  };
});

export const { GET, POST } = handlers;
export { auth, signIn, signOut };
