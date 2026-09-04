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
 *
 * **`name`은 사용자가 직접 정한 적이 없을 때만 덮어쓴다.** 닉네임을 정해 둔 계정을
 * 다음 로그인에서 제공자 이름으로 되돌리면, 바꾼 사람은 자기가 뭘 잘못했는지도 모른 채
 * 이름이 원상복구되는 것을 보게 된다 (마이그레이션 0005).
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
       name  = CASE WHEN users.name_changed_at IS NULL THEN excluded.name ELSE users.name END,
       email = COALESCE(excluded.email, users.email)
     RETURNING id, role;`,
  )
    .bind(id, input.provider, input.providerId, input.name, input.email, now)
    .first<{ id: string; role: UserRole }>();

  if (!row) throw new Error("사용자 upsert 결과가 비어 있습니다.");
  return row;
}

// ------------------------------------------------------------------ 프로필

/** 닉네임 최소·최대 길이. 한 글자는 사람을 구별하지 못하고, 스무 자를 넘으면 목록이 깨진다. */
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 20;

/** 닉네임을 다시 바꾸기까지 기다려야 하는 날. */
export const NAME_CHANGE_COOLDOWN_DAYS = 30;

/**
 * 운영자를 사칭하는 이름은 막는다.
 *
 * 이 사이트에서 이름은 편집 기록 옆에 남는 유일한 신원 표시라, `운영자`라고 적힌
 * 이름이 남긴 편집은 실제 운영자의 판단처럼 읽힌다.
 */
const RESERVED = ["운영자", "관리자", "admin", "administrator", "깨남"];

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

/**
 * 닉네임을 다듬고 검사한다. **저장 직전에 서버에서 부른다** — 화면의 검사는 편의일 뿐이다.
 *
 * 앞뒤 공백을 버리고 연속 공백을 하나로 줄인다. `홍  길동`과 `홍 길동`이 다른 사람으로
 * 보이면 안 되고, 보이지 않는 문자로 남을 흉내 내는 이름도 막아야 한다.
 */
export function normalizeName(raw: string): NameCheck {
  /* 제어 문자와 눈에 보이지 않는 공백류를 먼저 걷어낸다. */
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2060\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < MIN_NAME_LENGTH) {
    return { ok: false, reason: `닉네임은 ${MIN_NAME_LENGTH}자 이상이어야 합니다.` };
  }
  if (cleaned.length > MAX_NAME_LENGTH) {
    return { ok: false, reason: `닉네임은 ${MAX_NAME_LENGTH}자를 넘을 수 없습니다.` };
  }
  const folded = cleaned.toLowerCase().replace(/\s/g, "");
  if (RESERVED.some((word) => folded.includes(word))) {
    return { ok: false, reason: "운영자로 오해할 수 있는 낱말은 쓸 수 없습니다." };
  }
  return { ok: true, name: cleaned };
}

export type Profile = {
  id: string;
  name: string;
  provider: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  /** 닉네임을 직접 정한 적이 있으면 그 시각. 없으면 아직 제공자가 준 이름이다. */
  nameChangedAt: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const DB = await db();
  const row = await DB.prepare(
    `SELECT id, name, provider, email, role, created_at, name_changed_at
       FROM users WHERE id = ?1`,
  )
    .bind(userId)
    .first<{
      id: string;
      name: string;
      provider: string;
      email: string | null;
      role: UserRole;
      created_at: string;
      name_changed_at: string | null;
    }>();

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    nameChangedAt: row.name_changed_at,
  };
}

/** 다음에 닉네임을 바꿀 수 있는 시각. 아직 한 번도 안 바꿨으면 null (지금 바꿀 수 있다). */
export function nextNameChangeAt(nameChangedAt: string | null): Date | null {
  if (!nameChangedAt) return null;
  const at = new Date(nameChangedAt);
  if (Number.isNaN(at.getTime())) return null;
  return new Date(at.getTime() + NAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
}

export type RenameResult = { ok: true } | { ok: false; reason: string };

/**
 * 닉네임을 바꾼다.
 *
 * 같은 이름을 쓰는 계정이 있으면 거절한다. **로그인 시점에는 이 검사를 하지 않는다** —
 * 소셜 제공자가 준 이름이 남과 겹친다고 로그인이 실패하면 안 되기 때문이다. 그래서
 * 표에 유일 제약을 걸지 않고 여기서만 본다. 드물게 같은 이름이 공존할 수 있고,
 * 그때는 먼저 자리를 잡은 쪽이 이긴다.
 */
export async function renameUser(userId: string, rawName: string): Promise<RenameResult> {
  const checked = normalizeName(rawName);
  if (!checked.ok) return { ok: false, reason: checked.reason };

  const DB = await db();

  const current = await DB.prepare(`SELECT name, name_changed_at FROM users WHERE id = ?1`)
    .bind(userId)
    .first<{ name: string; name_changed_at: string | null }>();
  if (!current) return { ok: false, reason: "계정을 찾을 수 없습니다." };

  if (current.name === checked.name) return { ok: true };

  const next = nextNameChangeAt(current.name_changed_at);
  if (next && next.getTime() > Date.now()) {
    return {
      ok: false,
      reason: `닉네임은 ${NAME_CHANGE_COOLDOWN_DAYS}일에 한 번 바꿀 수 있습니다.`,
    };
  }

  /* 공백과 대소문자를 접어 비교한다. `깨 남`과 `깨남`이 다른 사람으로 보이면 안 된다. */
  const taken = await DB.prepare(
    `SELECT id FROM users
      WHERE id <> ?1 AND LOWER(REPLACE(name, ' ', '')) = LOWER(REPLACE(?2, ' ', ''))`,
  )
    .bind(userId, checked.name)
    .first<{ id: string }>();
  if (taken) return { ok: false, reason: "이미 쓰이고 있는 닉네임입니다." };

  await DB.prepare(`UPDATE users SET name = ?1, name_changed_at = ?2 WHERE id = ?3`)
    .bind(checked.name, new Date().toISOString(), userId)
    .run();

  return { ok: true };
}

/**
 * 회원 탈퇴 (개인정보처리방침 7항).
 *
 * 계정 행은 지우지만 **기여한 글은 지우지 않는다.** 위키 문서는 여러 사람이 이어 쓴
 * 공동 저작물이라, 한 사람이 나갔다고 그 부분만 들어내면 남은 글이 말이 안 되게 된다.
 * 방침 5항이 "탈퇴 이후에도 개인을 식별할 수 없는 형태로 남을 수 있다"고 밝힌 그대로,
 * 작성자 참조만 끊어 `탈퇴 계정`으로 보이게 한다.
 *
 * 참조를 먼저 끊는 것은 순서가 아니라 필수다. `users`를 참조하는 외래 키에
 * `ON DELETE` 규칙이 없어, 참조가 남은 채로는 삭제 자체가 실패한다.
 */
export async function deleteUser(userId: string): Promise<void> {
  const DB = await db();
  await DB.batch([
    DB.prepare(`UPDATE wiki_docs SET updated_by = NULL WHERE updated_by = ?1`).bind(userId),
    DB.prepare(`UPDATE wiki_sections SET updated_by = NULL WHERE updated_by = ?1`).bind(userId),
    DB.prepare(`UPDATE wiki_edits SET author = NULL WHERE author = ?1`).bind(userId),
    DB.prepare(`UPDATE wiki_edits SET reviewer = NULL WHERE reviewer = ?1`).bind(userId),
    DB.prepare(`UPDATE champion_placements SET updated_by = NULL WHERE updated_by = ?1`).bind(
      userId,
    ),
    DB.prepare(`DELETE FROM users WHERE id = ?1`).bind(userId),
  ]);
}
