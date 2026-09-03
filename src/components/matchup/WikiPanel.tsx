"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { WikiView } from "@/lib/wikiStore";
import { eulReul, ro } from "@/lib/josa";
import { buildQuery } from "@/lib/url";

import { MarkdownBody } from "../wiki/MarkdownBody";
import { EditSectionPanel } from "./EditSectionPanel";
import { MeCombobox } from "./MeCombobox";
import type { ChampionOption, ChampionView, PositionView } from "./types";
import styles from "./WikiPanel.module.css";

type Viewer = { id: string; name: string; role: "member" | "admin" } | null;

type Props = {
  position: PositionView;
  champion: ChampionView;
  patch: string;
  /** 서버가 D1에서 읽어 온 문서. `me` 질의에 해당하는 섹션이 이미 담겨 있다. */
  wiki: WikiView;
  positionChampions: ChampionOption[];
  allChampions: ChampionOption[];
  viewer: Viewer;
};

/**
 * 매치업 위키 열람·편집 화면 (PRD FR-12, FR-13, FR-24~26).
 *
 * 내 챔피언을 고르면 공통 상대법과 그 챔피언 섹션이 함께 보인다. 고르지 않으면 공통만 보인다.
 * 섹션 내용은 서버에서 가져오므로, 콤보박스 변경은 URL을 바꿔 서버 렌더를 다시 태운다.
 *
 * 편집기는 모달이 아니라 `?edit=general` / `?edit=me:<슬러그>` URL 상태로 연다 — 이
 * 화면 전체가 이미 URL 기반 상태(`me`, `tab`)를 쓰고 있는 것과 같은 방식이다.
 */
export function WikiPanel({
  position,
  champion,
  patch,
  wiki,
  positionChampions,
  allChampions,
  viewer,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const meSlug = searchParams.get("me");
  const meChampion = allChampions.find((c) => c.slug === meSlug) ?? null;

  const editParam = searchParams.get("edit");
  const editingGeneral = editParam === "general";
  const editingMe = meSlug !== null && editParam === `me:${meSlug}`;

  const setMe = useCallback(
    (slug: string | null) => {
      router.replace(`${pathname}${buildQuery(searchParams.toString(), { me: slug, edit: null })}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const editHref = (target: "general" | `me:${string}`) =>
    `${pathname}${buildQuery(searchParams.toString(), { edit: target })}`;

  /** 내용이 있는 챔피언을 이름으로 바꿔 안내에 쓴다. */
  const filledNames = wiki.filledMeSlugs
    .map((slug) => allChampions.find((c) => c.slug === slug)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className={styles.panel}>
      {/* ------------------------------------------------------ 내 챔피언 선택 */}
      <div className={styles.controls}>
        <MeCombobox
          positionChampions={positionChampions}
          allChampions={allChampions}
          positionName={position.name}
          value={meSlug}
          onChange={setMe}
        />
      </div>

      {/* --------------------------------------------------------- 공통 상대법 */}
      <section className={styles.section} aria-labelledby="wiki-general">
        <div className={styles.sectionHead}>
          <span className="sticker sticker--cobalt">general</span>
          <h3 className={styles.sectionTitle} id="wiki-general">
            공통 상대법
          </h3>
          <EditEntryButton
            href={editHref("general")}
            loginHref={`/login?callbackUrl=${encodeURIComponent(editHref("general"))}`}
            viewer={viewer}
          />
        </div>

        {wiki.general.trim() ? (
          <div className={styles.body}>
            <MarkdownBody text={wiki.general} />
          </div>
        ) : (
          <p className={styles.empty}>
            {position.name}에서 {champion.name}
            {eulReul(champion.name)} 상대하는 공통 상대법이 아직 없습니다.
          </p>
        )}

        {editingGeneral && viewer && (
          <EditSectionPanel
            positionSlug={position.slug}
            championSlug={champion.slug}
            patch={patch}
            meSlug={null}
            sectionTitle="공통 상대법"
            currentBody={wiki.general}
            isEmpty={!wiki.general.trim()}
            isAdmin={viewer.role === "admin"}
          />
        )}
      </section>

      {/* ------------------------------------------------- 내 챔피언 전용 상대법 */}
      {meChampion ? (
        <section className={styles.section} aria-labelledby="wiki-me">
          <div className={styles.sectionHead}>
            <span className="sticker sticker--gum">me / {meChampion.name}</span>
            <h3 className={styles.sectionTitle} id="wiki-me">
              {meChampion.name}
              {ro(meChampion.name)} 상대할 때
            </h3>
            <EditEntryButton
              href={editHref(`me:${meChampion.slug}`)}
              loginHref={`/login?callbackUrl=${encodeURIComponent(editHref(`me:${meChampion.slug}`))}`}
              viewer={viewer}
            />
          </div>

          {wiki.meSection ? (
            <div className={styles.body}>
              <MarkdownBody text={wiki.meSection.body} />
            </div>
          ) : (
            <p className={styles.empty}>
              {meChampion.name}
              {ro(meChampion.name)} {champion.name}
              {eulReul(champion.name)} 상대하는 내용이 아직 없습니다.
            </p>
          )}

          {editingMe && viewer && (
            <EditSectionPanel
              positionSlug={position.slug}
              championSlug={champion.slug}
              patch={patch}
              meSlug={meChampion.slug}
              sectionTitle={`${meChampion.name} 전용 상대법`}
              currentBody={wiki.meSection?.body ?? ""}
              isEmpty={!wiki.meSection}
              isAdmin={viewer.role === "admin"}
            />
          )}
        </section>
      ) : (
        <p className={styles.notice}>
          <span className="sticker sticker--cobalt">general</span>
          <span>
            지금은 누구에게나 적용되는 상대법만 보고 있습니다. 위에서 내 챔피언을 고르면 전용
            상대법이 더 나타납니다.
            {filledNames.length > 0 && (
              <>
                {" "}
                지금까지 <strong>{filledNames.join(", ")}</strong> 내용이 있습니다.
              </>
            )}
          </span>
        </p>
      )}

      {/* ------------------------------------------------------------ 문서 정보 */}
      {wiki.exists && (
        <p className={`mono ${styles.meta}`}>
          <Link href={`${pathname}/history`} className={styles.historyLink}>
            r{wiki.revision} 역사
          </Link>
          <span aria-hidden="true">|</span>
          <span>{formatDate(wiki.updatedAt)} 갱신</span>
          {wiki.updatedBy && (
            <>
              <span aria-hidden="true">|</span>
              <span>{wiki.updatedBy}</span>
            </>
          )}
          {wiki.patch && (
            <>
              <span aria-hidden="true">|</span>
              <span>패치 {wiki.patch}</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** 섹션 제목 옆 편집 진입 버튼. 비로그인은 로그인 화면으로 보내고 돌아온다 (흐름 B). */
function EditEntryButton({
  href,
  loginHref,
  viewer,
}: {
  href: string;
  loginHref: string;
  viewer: Viewer;
}) {
  return (
    <Link
      href={viewer ? href : loginHref}
      prefetch={false}
      className={`sticker ${styles.editButton}`}
    >
      편집
    </Link>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
