"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { hasFinePointer } from "@/lib/motion";

import styles from "./ChampionAside.module.css";
import type { ChampionView, PositionView, SkillView } from "./types";

type Props = {
  champion: ChampionView;
  position: PositionView;
  patch: string;
};

export function ChampionAside({ champion, position, patch }: Props) {
  /** 한 번에 하나만 열린다 (PRD 9). */
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [illustrationFailed, setIllustrationFailed] = useState(false);
  const skillsRef = useRef<HTMLDivElement>(null);

  // Escape 키와 외부 클릭으로 닫는다 (PRD 9).
  useEffect(() => {
    if (!openSlot) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenSlot(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!skillsRef.current?.contains(event.target as Node)) setOpenSlot(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openSlot]);

  const open = useCallback((slot: string) => setOpenSlot(slot), []);
  const toggle = useCallback(
    (slot: string) => setOpenSlot((current) => (current === slot ? null : slot)),
    [],
  );

  const openSkill = champion.spells.find((s) => s.slot === openSlot) ?? null;

  return (
    <aside className={styles.aside} aria-label={`${champion.name} 정보`}>
      {/* --------------------------------------------------- 일러스트 무대 */}
      <div className={styles.stage}>
        {/* 인쇄 재단선 패턴 */}
        <span className={styles.registerMarks} aria-hidden="true" />

        {/* 일러스트 뒤에서 일부 가려지는 초대형 이름 */}
        <span className={`display ${styles.nameBehind}`} aria-hidden="true">
          {champion.name}
        </span>

        {illustrationFailed ? (
          /* 로드에 실패하면 아이콘과 이름으로 대체한다 (PRD 5.3.1, FR-08). */
          <div className={styles.fallback}>
            <img
              className={styles.fallbackIcon}
              src={champion.iconUrl}
              alt=""
              width={120}
              height={120}
            />
            <p className={styles.fallbackName}>{champion.name}</p>
            <p className={styles.fallbackNote}>일러스트를 불러오지 못했습니다.</p>
          </div>
        ) : (
          <img
            className={styles.illustration}
            src={champion.illustrationUrl}
            alt={`${champion.name} 일러스트`}
            /* 원본 크기를 지정해 로딩 중 레이아웃 이동을 막는다 (PRD 10 성능). */
            width={308}
            height={560}
            style={{ objectPosition: champion.focus }}
            fetchPriority="high"
            decoding="async"
            onError={() => setIllustrationFailed(true)}
          />
        )}

        {/* 읽을 수 있는 작은 이름 레이블 (블루프린트 6.3) */}
        <div className={styles.nameplate}>
          <h1 className={styles.name}>{champion.name}</h1>
          <p className={`mono ${styles.title}`}>{champion.title}</p>
          <p className={`sticker sticker--gum ${styles.positionTag}`}>{position.name}</p>
        </div>

        <p className={`mono sticker ${styles.patchTag}`}>patch {patch}</p>
      </div>

      {/* ------------------------------------------------------ Q / W / E / R */}
      <div className={styles.skills} ref={skillsRef}>
        <p className="section-index">스킬 / Q W E R</p>

        <ul className={styles.skillRow}>
          {champion.spells.map((spell) => {
            const isOpen = openSlot === spell.slot;
            return (
              <li key={spell.slot} className={styles.skillItem}>
                <button
                  type="button"
                  className={`${styles.skill} ${isOpen ? styles.skillOpen : ""}`}
                  aria-expanded={isOpen}
                  aria-controls="skill-note"
                  onClick={() => toggle(spell.slot)}
                  onFocus={() => open(spell.slot)}
                  onPointerEnter={() => {
                    if (hasFinePointer()) open(spell.slot);
                  }}
                >
                  <span className={styles.skillIconWrap}>
                    <img
                      className={styles.skillIcon}
                      src={spell.iconUrl}
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                    />
                    {/* 쿨타임은 아이콘 우측 상단에 모노 글꼴로 (블루프린트 6.3). */}
                    {spell.cooldown && (
                      <span className={`mono ${styles.cooldown}`}>{firstValue(spell.cooldown)}s</span>
                    )}
                  </span>
                  <span className={`mono ${styles.slot}`}>{spell.slot}</span>
                  <span className="sr-only">
                    {spell.name} 상세 정보 {isOpen ? "닫기" : "열기"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* 일반 툴팁 대신 종이색 공략 쪽지로 펼쳐진다 (블루프린트 6.3). */}
        {openSkill && <SkillNote skill={openSkill} onClose={() => setOpenSlot(null)} />}
      </div>
    </aside>
  );
}

/** "9/8/7/6/5"에서 1레벨 값만 뽑는다. 아이콘 위에는 1레벨 기준 쿨타임을 표시한다. */
function firstValue(burn: string): string {
  return burn.split("/")[0];
}

function SkillNote({ skill, onClose }: { skill: SkillView; onClose: () => void }) {
  return (
    <div className={`${styles.note} on-paper`} id="skill-note" role="dialog" aria-label={`${skill.name} 상세`}>
      <div className={styles.noteHead}>
        <p className={styles.noteName}>
          <span className={`mono ${styles.noteSlot}`}>{skill.slot}</span>
          {skill.name}
        </p>
        <button type="button" className={styles.noteClose} onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      <dl className={`mono ${styles.noteStats}`}>
        <div>
          <dt>재사용 대기시간</dt>
          <dd>{skill.cooldown ? `${skill.cooldown}초` : "—"}</dd>
        </div>
        <div>
          <dt>소모</dt>
          <dd>{skill.cost ? `${skill.cost}${skill.costType ? ` ${skill.costType}` : ""}` : "없음"}</dd>
        </div>
        <div>
          <dt>범위</dt>
          <dd>{skill.range ?? "—"}</dd>
        </div>
      </dl>

      <p className={styles.noteBody}>{skill.description}</p>
    </div>
  );
}
