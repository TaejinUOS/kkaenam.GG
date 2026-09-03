"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { matchesName, normalizeQuery } from "@/lib/url";

import styles from "./MeCombobox.module.css";
import type { ChampionOption } from "./types";

type Props = {
  /** 현재 포지션의 챔피언. 기본 검색 대상이다 (PRD 5.3.3). */
  positionChampions: ChampionOption[];
  /** 포지션 밖 챔피언까지 찾을 수 있도록 전체 목록도 함께 받는다. */
  allChampions: ChampionOption[];
  positionName: string;
  value: string | null;
  onChange: (slug: string | null) => void;
  /** 제목 줄에 끼워 넣을 때. 라벨을 화면에서 감추고 폭을 줄인다. */
  compact?: boolean;
};

type Group = { label: string; options: ChampionOption[] };

export function MeCombobox({
  positionChampions,
  allChampions,
  positionName,
  value,
  onChange,
  compact = false,
}: Props) {
  const listboxId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => allChampions.find((c) => c.slug === value) ?? null,
    [allChampions, value],
  );

  const positionSlugs = useMemo(
    () => new Set(positionChampions.map((c) => c.slug)),
    [positionChampions],
  );

  /** 현재 포지션을 먼저 보여 주고, 검색어가 있을 때만 다른 포지션까지 넓힌다. */
  const groups: Group[] = useMemo(() => {
    const needle = normalizeQuery(term);
    const inPosition = positionChampions.filter((c) => matchesName(needle, c.name, c.slug));
    const result: Group[] = [{ label: `${positionName} 챔피언`, options: inPosition }];

    if (needle) {
      const outside = allChampions.filter(
        (c) => !positionSlugs.has(c.slug) && matchesName(needle, c.name, c.slug),
      );
      if (outside.length > 0) result.push({ label: "다른 포지션", options: outside.slice(0, 20) });
    }
    return result.filter((g) => g.options.length > 0);
  }, [term, positionChampions, allChampions, positionSlugs, positionName]);

  const flat = useMemo(() => groups.flatMap((g) => g.options), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [term]);

  // 외부 클릭으로 닫는다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function commit(slug: string | null) {
    onChange(slug);
    setOpen(false);
    setTerm("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setTerm("");
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + delta + flat.length) % Math.max(flat.length, 1));
      return;
    }
    if (event.key === "Enter" && open && flat[activeIndex]) {
      event.preventDefault();
      commit(flat[activeIndex].slug);
    }
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.wrapCompact : ""}`} ref={rootRef}>
      {/* 좁게 놓을 때도 라벨을 지우지 않는다. 화면에서만 감추고 낭독기에는 남긴다. */}
      <label className={`mono ${compact ? "sr-only" : styles.label}`} htmlFor={inputId}>
        ME / 내 챔피언 선택
      </label>

      <div className={styles.field}>
        {selected && (
          <img className={styles.selectedIcon} src={selected.iconUrl} alt="" width={26} height={26} />
        )}

        <input
          id={inputId}
          ref={inputRef}
          className={styles.input}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && flat[activeIndex] ? `${listboxId}-${activeIndex}` : undefined}
          placeholder={selected ? selected.name : "내 챔피언을 검색하세요"}
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />

        {selected && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              commit(null);
              inputRef.current?.focus();
            }}
          >
            해제
            <span className="sr-only">{selected.name} 선택 해제</span>
          </button>
        )}

        <button
          type="button"
          className={styles.caret}
          aria-label={open ? "목록 닫기" : "목록 열기"}
          tabIndex={-1}
          onClick={() => {
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
        >
          ▾
        </button>
      </div>

      {open && (
        <ul className={styles.listbox} id={listboxId} role="listbox" aria-label="내 챔피언">
          {flat.length === 0 && (
            <li className={styles.noResult}>
              &lsquo;{term}&rsquo;와 일치하는 챔피언이 없습니다.
            </li>
          )}

          {groups.map((group) => (
            <li key={group.label} role="presentation">
              <p className={`mono ${styles.groupLabel}`} role="presentation">
                {group.label}
              </p>
              <ul role="presentation">
                {group.options.map((option) => {
                  const index = flat.indexOf(option);
                  return (
                    <li
                      key={option.slug}
                      id={`${listboxId}-${index}`}
                      role="option"
                      aria-selected={option.slug === value}
                      className={`${styles.option} ${index === activeIndex ? styles.optionActive : ""}`}
                      onPointerDown={(event) => {
                        // pointerdown 단계에서 처리해야 외부 클릭 감지보다 먼저 선택된다.
                        event.preventDefault();
                        commit(option.slug);
                      }}
                      onPointerEnter={() => setActiveIndex(index)}
                    >
                      <img src={option.iconUrl} alt="" width={24} height={24} />
                      <span>{option.name}</span>
                      {option.slug === value && (
                        <span className={`mono ${styles.check}`} aria-hidden="true">
                          선택됨
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
