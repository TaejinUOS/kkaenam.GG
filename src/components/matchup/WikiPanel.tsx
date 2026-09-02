"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { WikiView } from "@/lib/wikiStore";
import { eulReul, ro } from "@/lib/josa";
import { buildQuery } from "@/lib/url";

import { MeCombobox } from "./MeCombobox";
import type { ChampionOption, ChampionView, PositionView } from "./types";
import styles from "./WikiPanel.module.css";

type Props = {
  position: PositionView;
  champion: ChampionView;
  /** 서버가 D1에서 읽어 온 문서. `me` 질의에 해당하는 섹션이 이미 담겨 있다. */
  wiki: WikiView;
  positionChampions: ChampionOption[];
  allChampions: ChampionOption[];
};

/**
 * 매치업 위키 열람 화면 (PRD FR-12, FR-13).
 *
 * 내 챔피언을 고르면 공통 상대법과 그 챔피언 섹션이 함께 보인다. 고르지 않으면 공통만 보인다.
 * 섹션 내용은 서버에서 가져오므로, 콤보박스 변경은 URL을 바꿔 서버 렌더를 다시 태운다.
 *
 * 편집은 4단계에서 붙인다. 지금은 읽기 전용이다.
 */
export function WikiPanel({
  position,
  champion,
  wiki,
  positionChampions,
  allChampions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const meSlug = searchParams.get("me");
  const meChampion = allChampions.find((c) => c.slug === meSlug) ?? null;

  const setMe = useCallback(
    (slug: string | null) => {
      router.replace(`${pathname}${buildQuery(searchParams.toString(), { me: slug })}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

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
        </div>

        {wiki.general.trim() ? (
          <Body text={wiki.general} />
        ) : (
          <p className={styles.empty}>
            {position.name}에서 {champion.name}
            {eulReul(champion.name)} 상대하는 공통 상대법이 아직 없습니다.
          </p>
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
          </div>

          {wiki.meSection ? (
            <Body text={wiki.meSection.body} />
          ) : (
            <p className={styles.empty}>
              {meChampion.name}
              {ro(meChampion.name)} {champion.name}
              {eulReul(champion.name)} 상대하는 내용이 아직 없습니다.
            </p>
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
          <span>r{wiki.revision}</span>
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

/**
 * 위키 본문. 마크다운 지원 여부가 아직 정해지지 않아(PRD 15 미결정 6번) 평문으로 그린다.
 * 빈 줄로 나뉜 덩어리를 문단으로 만든다.
 */
function Body({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={styles.body}>
      {paragraphs.map((p, i) => (
        <p key={i} className={styles.paragraph}>
          {p}
        </p>
      ))}
    </div>
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
