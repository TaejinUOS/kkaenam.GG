/**
 * 로그인 사용자 upsert — D1 접근 계층.
 *
 * `wikiStore.ts`와 같은 패턴을 쓴다. `server-only`를 import해 클라이언트 번들에
 * 섞이면 빌드가 실패하게 한다.
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { UserRole } from "@/data/wiki";

async function db() {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

export type UpsertedUser = { id: string; role: UserRole };

/**
 * 소셜 로그인 성공 시 호출한다. `(provider, provider_id)`가 이미 있으면 이름·이메일만
 * 갱신하고, 없으면 새 행을 만든다.
 *
 * `role`은 INSERT 열 목록에서 뺀다 — 스키마의 `DEFAULT 'member'`가 신규 계정에 적용되고,
 * 이미 있는 계정을 수동으로 'admin'으로 올려 둔 값은 이 upsert가 건드리지 않는다.
 * `email`은 새 값이 있을 때만 덮어쓴다 — 카카오는 이메일이 선택 동의라, 이전에 동의해
 * 저장된 이메일을 이번 로그인에서 동의를 껐다고 잃지 않게 한다.
 */
export async function upsertUser(input: {
  provider: "google" | "kakao";
  providerId: string;
  name: string;
  email: string | null;
}): Promise<UpsertedUser> {
  const DB = await db();
  const id = `user-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const row = await DB.prepare(
    `INSERT INTO users (id, provider, provider_id, name, email, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT (provider, provider_id) DO UPDATE SET
       name  = excluded.name,
       email = COALESCE(excluded.email, users.email)
     RETURNING id, role;`,
  )
    .bind(id, input.provider, input.providerId, input.name, input.email, now)
    .first<{ id: string; role: UserRole }>();

  if (!row) throw new Error("사용자 upsert 결과가 비어 있습니다.");
  return row;
}
