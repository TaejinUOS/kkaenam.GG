"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { WikiLinkMap } from "@/lib/wikiLink";
import type { WikiView } from "@/lib/wikiStore";
import { eulReul, ro } from "@/lib/josa";
import { buildQuery } from "@/lib/url";

import { type DocSection, WikiDocument } from "../wiki/WikiDocument";
import { EditSectionPanel } from "./EditSectionPanel";
import { MeCombobox } from "./MeCombobox";
import type { ChampionOption, ChampionView, PositionView } from "./types";
import styles from "./WikiPanel.module.css";

type Viewer = { id: string; name: string; role: "member" | "admin" } | null;

type Props = {
  position: PositionView;
  champion: ChampionView;
  patch: string;
  /** 서버가 D1에서 읽어 온 문서. 내용이 있는 섹션이 모두 담겨 있다. */
  wiki: WikiView;
  /** 본문에 적힌 `[[...]]`를 서버가 미리 풀어 둔 결과. */
  wikiLinks: WikiLinkMap;
  positionChampions: ChampionOption[];
  allChampions: ChampionOption[];
  viewer: Viewer;
};

/** 공통 상대법 섹션의 앵커. */
const GENERAL_ID = "general";

const meId = (slug: string) => `me-${slug}`;

/**
 * 매치업 위키 열람·편집 화면 (PRD FR-12, FR-13, FR-24~26).
 *
 * 공통 상대법과 내 챔피언별 상대법이 **한 문서**로 이어진다. 목차가 하나이고 번호도
 * 문서 전체를 관통한다. 내 챔피언을 고르는 것은 걸러내기가 아니라 그 제목으로 옮겨
 * 가는 일이다 (`docs/WIKI_MODEL.md` "문서 구조").
 *
 * 그래서 `?me=`는 서버 렌더에 영향을 주지 않는다. 콤보박스를 바꿔도 서버를 다시
 * 부르지 않고 `history.replaceState`로 주소만 갱신한다 — 주소를 공유하면 상대도 같은
 * 자리에서 문서를 열게 되지만, 고르는 동안 왕복이 끼어들지는 않는다.
 *
 * 편집기는 모달이 아니라 `?edit=general` / `?edit=me:<슬러그>` URL 상태로 연다.
 */
export function WikiPanel({
  position,
  champion,
  patch,
  wiki,
  wikiLinks,
  positionChampions,
  allChampions,
  viewer,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const meSlug = searchParams.get("me");
  const meChampion = allChampions.find((c) => c.slug === meSlug) ?? null;

  const editParam = searchParams.get("edit");
  const editingGeneral = editParam === "general";
  const editingMe = meSlug !== null && editParam === `me:${meSlug}`;

  /** 같은 챔피언을 다시 골라도 그 자리로 다시 옮겨 가도록 세는 값. */
  const [focusNonce, setFocusNonce] = useState(0);

  const setMe = useCallback(
    (slug: string | null) => {
      /*
       * `router.replace`가 아니라 `history.replaceState`인 것은 서버 왕복을 없애기
       * 위해서다. 문서 내용이 `me`에 좌우되지 않으므로 서버에 물을 것이 없다.
       */
      window.history.replaceState(
        null,
        "",
        `${pathname}${buildQuery(searchParams.toString(), { me: slug, edit: null })}`,
      );
      setFocusNonce((n) => n + 1);
    },
    [pathname, searchParams],
  );

  const editHref = (target: "general" | `me:${string}`) =>
    `${pathname}${buildQuery(searchParams.toString(), { edit: target })}`;

  const resolveLink = useCallback((target: string) => wikiLinks[target] ?? null, [wikiLinks]);

  /*
   * 문서를 이루는 섹션 목록. 공통이 먼저이고, 내용이 있는 내 챔피언 섹션이 이름순으로
   * 뒤따른다 (`allChampions`가 이미 한국어 이름순이다).
   */
  const sections = useMemo<DocSection[]>(() => {
    const byChampion = new Map(wiki.meSections.map((s) => [s.championSlug, s]));

    const general: DocSection = {
      id: GENERAL_ID,
      title: "공통 상대법",
      badge: <span className="sticker sticker--cobalt">general</span>,
      body: wiki.general,
      action: (
        <EditEntryButton
          href={editHref("general")}
          loginHref={`/login?callbackUrl=${encodeURIComponent(editHref("general"))}`}
          viewer={viewer}
        />
      ),
      empty: (
        <p className={styles.empty}>
          {position.name}에서 {champion.name}
          {eulReul(champion.name)} 상대하는 공통 상대법이 아직 없습니다.
        </p>
      ),
    };

    const filled = allChampions
      .filter((c) => byChampion.has(c.slug))
      .map<DocSection>((c) => ({
        id: meId(c.slug),
        title: `${c.name}${ro(c.name)} 상대할 때`,
        badge: <span className="sticker sticker--gum">me / {c.name}</span>,
        body: byChampion.get(c.slug)?.body ?? "",
        action: (
          <EditEntryButton
            href={editHref(`me:${c.slug}`)}
            loginHref={`/login?callbackUrl=${encodeURIComponent(editHref(`me:${c.slug}`))}`}
            viewer={viewer}
          />
        ),
      }));

    /*
     * 아직 아무도 쓰지 않은 챔피언을 골랐을 때. 문서에 없는 앵커로 뛸 수는 없으므로
     * 고른 동안만 자리를 만들어 둔다. 목차에도 나타나고, 거기서 바로 쓰기 시작할 수 있다.
     */
    if (meChampion && !byChampion.has(meChampion.slug)) {
      filled.push({
        id: meId(meChampion.slug),
        title: `${meChampion.name}${ro(meChampion.name)} 상대할 때`,
        badge: <span className="sticker sticker--gum">me / {meChampion.name}</span>,
        body: "",
        action: (
          <EditEntryButton
            href={editHref(`me:${meChampion.slug}`)}
            loginHref={`/login?callbackUrl=${encodeURIComponent(editHref(`me:${meChampion.slug}`))}`}
            viewer={viewer}
          />
        ),
        empty: (
          <p className={styles.empty}>
            {meChampion.name}
            {ro(meChampion.name)} {champion.name}
            {eulReul(champion.name)} 상대하는 내용이 아직 없습니다. 첫 번째로 써 보세요 — 빈
            부분이라 저장하면 바로 반영됩니다.
          </p>
        ),
      });
    }

    return [general, ...filled];
    // editHref는 searchParams에서 파생되므로 그 값만 의존성으로 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wiki, allChampions, meChampion, viewer, position.name, champion.name, searchParams, pathname]);

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
        <p className={styles.controlsHint}>
          고른 챔피언의 상대법으로 문서 안에서 바로 이동합니다.
          {wiki.meSections.length === 0 && " 아직 챔피언별 상대법은 하나도 없습니다."}
        </p>
      </div>

      {/* ---------------------------------------------------------- 문서 본문 */}
      <WikiDocument
        sections={sections}
        resolveLink={resolveLink}
        focusId={meChampion ? meId(meChampion.slug) : null}
        focusNonce={focusNonce}
      />

      {/* -------------------------------------------------------------- 편집기 */}
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

      {editingMe && viewer && meChampion && (
        <EditSectionPanel
          positionSlug={position.slug}
          championSlug={champion.slug}
          patch={patch}
          meSlug={meChampion.slug}
          sectionTitle={`${meChampion.name} 전용 상대법`}
          currentBody={wiki.meSections.find((s) => s.championSlug === meChampion.slug)?.body ?? ""}
          isEmpty={!wiki.meSections.some((s) => s.championSlug === meChampion.slug)}
          isAdmin={viewer.role === "admin"}
        />
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
