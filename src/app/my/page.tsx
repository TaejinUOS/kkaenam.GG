import type { Metadata } from "next";
import Link from "next/link";

import { signOut } from "@/auth";
import { NicknameForm } from "@/components/my/NicknameForm";
import { requirePageUser } from "@/lib/authGuard";
import { deleteAccountAction } from "@/lib/actions/profileActions";
import { relativeTime } from "@/lib/relativeTime";
import {
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
  NAME_CHANGE_COOLDOWN_DAYS,
  getProfile,
  nextNameChangeAt,
} from "@/lib/userStore";
import { docHref, docSectionLabel, docTitle } from "@/lib/wikiDocTarget";
import { getMyContribution, listMyEdits } from "@/lib/wikiEditStore";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false, follow: false },
};

/** 마이페이지에 미리 보여 줄 최근 편집 줄 수. 나머지는 `/my/edits`가 맡는다. */
const RECENT_EDITS = 5;

const STATUS_LABEL: Record<string, string> = {
  pending: "검토 대기",
  accepted: "반영됨",
  rejected: "거절됨",
  withdrawn: "철회됨",
};

const PROVIDER_LABEL: Record<string, string> = {
  google: "구글",
  kakao: "카카오",
  system: "시스템",
};

const ERROR_LABEL: Record<string, string> = {
  confirm_mismatch: "닉네임이 일치하지 않아 탈퇴를 진행하지 않았습니다.",
  admin_cannot_leave: "운영자 계정은 탈퇴할 수 없습니다. 권한을 넘긴 뒤에 진행해 주세요.",
};

/**
 * 마이페이지.
 *
 * 위키에서 마이페이지의 본체는 프로필이 아니라 **기여 기록**이다. 얼마나 썼는지,
 * 지금 무엇이 검토를 기다리는지가 다시 들어올 이유가 된다. 그래서 닉네임 바로 다음이
 * 기여 요약이고, 설정처럼 보이는 것은 맨 아래로 내린다.
 */
export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await requirePageUser();
  const { error } = await searchParams;

  const [profile, contribution, edits] = await Promise.all([
    getProfile(viewer.id),
    getMyContribution(viewer.id),
    listMyEdits(viewer.id),
  ]);

  /* 세션은 살아 있는데 계정 행이 없다면 방금 탈퇴한 것이다. 로그인 화면으로 돌려보낸다. */
  if (!profile) {
    return (
      <div className={`shell ${styles.screen}`}>
        <h1 className={`display ${styles.title}`}>마이페이지</h1>
        <p className={styles.empty}>계정을 찾을 수 없습니다. 다시 로그인해 주세요.</p>
      </div>
    );
  }

  const lockedUntilDate = nextNameChangeAt(profile.nameChangedAt);
  const locked = lockedUntilDate && lockedUntilDate.getTime() > Date.now();
  const now = Date.now();

  const stats = [
    { key: "accepted", label: "반영된 편집", value: contribution.accepted },
    { key: "docs", label: "기여한 문서", value: contribution.docs },
    { key: "pending", label: "검토 대기", value: contribution.pending },
    { key: "rejected", label: "거절됨", value: contribution.rejected },
  ];

  return (
    <div className={`shell ${styles.screen}`}>
      <p className="section-index">마이페이지</p>
      <div className={styles.head}>
        <h1 className={`display ${styles.title}`}>{profile.name}</h1>
        {profile.role === "admin" && <span className="sticker sticker--acid">운영자</span>}
      </div>

      {error && <p className={styles.error}>{ERROR_LABEL[error] ?? "처리하지 못했습니다."}</p>}

      {/* ---------------------------------------------------------- 기여 요약 */}
      <section className={styles.section} aria-labelledby="my-contribution">
        <h2 id="my-contribution" className={styles.sectionTitle}>
          내 기여
        </h2>
        <ul className={styles.stats}>
          {stats.map((stat) => (
            <li key={stat.key} className={styles.stat}>
              <span className={`mono ${styles.statValue}`}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </li>
          ))}
        </ul>

        {edits.length === 0 ? (
          <p className={styles.empty}>
            아직 제출한 편집이 없습니다.{" "}
            <Link href="/wiki/wanted" className={styles.inlineLink}>
              아직 없는 문서
            </Link>
            에서 쓸 곳을 찾아보세요.
          </p>
        ) : (
          <>
            <ul className={styles.rows}>
              {edits.slice(0, RECENT_EDITS).map((edit) => {
                const section = docSectionLabel(edit.target, edit.meSlug);
                return (
                  <li key={edit.id}>
                    <Link href={docHref(edit.target)} className={styles.row}>
                      <span
                        className={`sticker ${
                          edit.status === "accepted"
                            ? "sticker--acid"
                            : edit.status === "pending"
                              ? "sticker--gum"
                              : ""
                        }`}
                      >
                        {STATUS_LABEL[edit.status] ?? edit.status}
                      </span>
                      <span className={styles.rowTitle}>
                        {docTitle(edit.target)}
                        <span className={styles.rowSection}> › {section}</span>
                      </span>
                      <time className={`mono ${styles.rowWhen}`} dateTime={edit.createdAt}>
                        {relativeTime(edit.createdAt, now)}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {edits.length > RECENT_EDITS && (
              <Link href="/my/edits" className={styles.more}>
                내 편집 전부 보기 ({edits.length}) <span aria-hidden="true">→</span>
              </Link>
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------------ 운영자 */}
      {profile.role === "admin" && (
        <section className={styles.section} aria-labelledby="my-admin">
          <h2 id="my-admin" className={styles.sectionTitle}>
            운영
          </h2>
          <div className={styles.links}>
            <Link href="/admin/wiki/review" className="btn">
              검토 대기열
            </Link>
            <Link href="/admin/wiki/recent" className="btn">
              최근 변경
            </Link>
            <Link href="/admin/taxonomy" className="btn">
              분류 편집
            </Link>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- 계정 */}
      <section className={styles.section} aria-labelledby="my-account">
        <h2 id="my-account" className={styles.sectionTitle}>
          계정
        </h2>

        <NicknameForm
          currentName={profile.name}
          minLength={MIN_NAME_LENGTH}
          maxLength={MAX_NAME_LENGTH}
          lockedUntil={locked ? formatDate(lockedUntilDate!.toISOString()) : null}
        />

        <dl className={styles.meta}>
          <div>
            <dt>로그인</dt>
            <dd>{PROVIDER_LABEL[profile.provider] ?? profile.provider}</dd>
          </div>
          <div>
            <dt>가입</dt>
            <dd>{formatDate(profile.createdAt)}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            {/*
              이메일은 소셜 제공자에게서 받은 값이라 여기서 고칠 수 없다. 카카오는
              선택 동의라 비어 있을 수 있다 (개인정보처리방침 2항).
            */}
            <dd>{profile.email ?? "제공받지 않음"}</dd>
          </div>
        </dl>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="btn btn--ghost">
            로그아웃
          </button>
        </form>
      </section>

      {/* -------------------------------------------------------------- 탈퇴 */}
      <section className={styles.danger} aria-labelledby="my-leave">
        <h2 id="my-leave" className={styles.sectionTitle}>
          회원 탈퇴
        </h2>
        <p className={styles.dangerLead}>
          계정과 개인정보는 지체 없이 파기됩니다. 다만{" "}
          <strong>지금까지 쓴 글은 문서에 남습니다</strong> — 위키 문서는 여러 사람이 이어 쓴
          공동 저작물이라, 한 사람의 몫만 들어내면 남은 글이 말이 되지 않습니다. 작성자
          표시는 <code className={styles.code}>탈퇴 계정</code>으로 바뀌어 개인을 알아볼 수
          없게 됩니다 (개인정보처리방침 5·7항).
        </p>

        <details className={styles.details}>
          <summary className={styles.summary}>탈퇴 진행</summary>
          <form action={deleteAccountAction} className={styles.leaveForm}>
            <label className={styles.leaveField}>
              <span className={styles.leaveLabel}>
                확인을 위해 닉네임 <strong>{profile.name}</strong>을(를) 그대로 입력하세요
              </span>
              <input
                type="text"
                name="confirm"
                className={styles.leaveInput}
                autoComplete="off"
                required
              />
            </label>
            <button type="submit" className={styles.leaveButton}>
              탈퇴하기
            </button>
          </form>
        </details>
      </section>

      <p className={styles.footnote}>
        닉네임은 {NAME_CHANGE_COOLDOWN_DAYS}일에 한 번 바꿀 수 있습니다.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
