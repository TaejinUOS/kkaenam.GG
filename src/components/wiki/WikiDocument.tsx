"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type Footnote,
  type OutlineNode,
  type WikiLinkResolver,
  buildOutline,
  extractFootnotes,
  numberOutline,
  stripInlineMarkup,
} from "@/lib/wikiMarkup";

import { MarkdownBody } from "./MarkdownBody";
import styles from "./WikiDocument.module.css";

/**
 * 문서를 이루는 한 섹션. 편집 단위이자 목차의 1단계 항목이다.
 *
 * 섹션이 곧 편집 단위라는 것은 `docs/WIKI_MODEL.md`의 결정이다. 화면을 하나로 합쳐도
 * 그 단위는 그대로여서, 편집 버튼과 즉시반영·검토 판정은 섹션마다 따로 논다.
 */
export type DocSection = {
  /** 앵커이자 목차 키. `general` 또는 `me-<슬러그>`. */
  id: string;
  title: string;
  /** 제목 곁의 스티커. 기본값은 제목 앞이다. */
  badge?: ReactNode;
  badgePosition?: "before" | "after";
  /** 섹션 본문 마크다운. */
  body: string;
  /** 제목 줄 오른쪽 조작부의 끝에 놓을 것. 편집 버튼이 여기로 온다. */
  action?: ReactNode;
  /** 편집 버튼 앞에 놓을 것. 공통 상대법 줄의 내 챔피언 콤보박스가 여기로 온다. */
  tools?: ReactNode;
  /** 본문이 비었을 때 대신 보여줄 안내. */
  empty?: ReactNode;
  /** Me 콤보박스에서 현재 고른 챔피언의 섹션. */
  current?: boolean;
};

type Props = {
  sections: DocSection[];
  resolveLink: WikiLinkResolver;
  /** 이 앵커로 옮겨 간다. `focusNonce`가 바뀔 때마다 다시 움직인다. */
  focusId?: string | null;
  focusNonce?: number;
};

/** 섹션이 1단계다. 그 아래 제목은 2단계부터 시작한다. */
const SECTION_LEVEL = 1;

type Prepared = {
  node: OutlineNode;
  notes: Footnote[];
  section: DocSection;
};

/**
 * 매치업 문서 한 장 — 목차와 접히는 번호 제목.
 *
 * 공통 상대법과 내 챔피언별 상대법이 **한 문서**로 이어진다. 내 챔피언을 고르는 것은
 * 걸러내기가 아니라 그 제목으로 옮겨 가는 일이다 (PRD FR-12, FR-13).
 *
 * 제목 트리는 markdown-to-jsx의 결과물이 아니라 원문에서 직접 뽑는다. 렌더러가 제목을
 * 평평하게 뱉어서, 결과물만으로는 "1.1 아래를 접는다"에 필요한 중첩을 복원할 수 없다.
 */
export function WikiDocument({ sections, resolveLink, focusId, focusNonce = 0 }: Props) {
  /*
   * 개요는 본문이 바뀔 때만 다시 만든다. 접기 상태가 바뀔 때마다 문서 전체를
   * 다시 파싱할 이유가 없다.
   */
  const { prepared, ancestors } = useMemo(() => {
    const usedIds = new Set<string>();
    const items: Prepared[] = sections.map((section) => {
      // 각주 정의는 본문을 제목 단위로 쪼개기 전에 걷어내야 한다. 글 끝에 모아 둔
      // 정의가 앞쪽 소제목의 참조에도 닿아야 하기 때문이다.
      const { body, notes } = extractFootnotes(section.body);
      const outline = buildOutline(body, section.id, SECTION_LEVEL + 1, usedIds);
      usedIds.add(section.id);

      return {
        section,
        notes,
        node: {
          id: section.id,
          number: "",
          title: section.title,
          level: SECTION_LEVEL,
          lead: outline.lead,
          children: outline.children,
        },
      };
    });

    numberOutline(items.map((item) => item.node));

    // 목차에서 접힌 제목으로 뛸 때 조상들을 함께 펼치려면 계보를 알아야 한다.
    const lineage = new Map<string, string[]>();
    const walk = (nodes: OutlineNode[], trail: string[]) => {
      for (const node of nodes) {
        lineage.set(node.id, trail);
        walk(node.children, [...trail, node.id]);
      }
    };
    walk(
      items.map((item) => item.node),
      [],
    );

    return { prepared: items, ancestors: lineage };
  }, [sections]);

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  /** 접힌 곳으로도 갈 수 있어야 한다. 목표와 그 조상을 먼저 펼치고 나서 옮겨 간다. */
  const goTo = useCallback(
    (id: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        for (const open of [...(ancestors.get(id) ?? []), id]) next.delete(open);
        return next;
      });
      setPendingScroll(id);
    },
    [ancestors],
  );

  // 펼치는 상태 변경이 그려진 뒤에 움직여야 목표가 제자리에 있다.
  useEffect(() => {
    if (!pendingScroll) return;
    const target = document.getElementById(pendingScroll);
    setPendingScroll(null);
    if (!target) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  }, [pendingScroll]);

  // 내 챔피언을 고르면 그 섹션으로 옮겨 간다. 같은 챔피언을 다시 골라도 움직이게
  // nonce를 함께 본다.
  useEffect(() => {
    if (focusId) goTo(focusId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, focusNonce]);

  const allCollapsed = collapsed.size > 0;

  return (
    <article className={styles.doc}>
      {prepared.map((item) => (
        <NodeView
          key={item.node.id}
          node={item.node}
          notes={item.notes}
          section={item.section}
          resolveLink={resolveLink}
          collapsed={collapsed}
          onToggle={toggle}
        />
      ))}

      <TocCorner
        nodes={prepared.map((item) => item.node)}
        onJump={goTo}
        onToggleAll={() =>
          setCollapsed(allCollapsed ? new Set() : new Set(collectIds(prepared.map((i) => i.node))))
        }
        allCollapsed={allCollapsed}
      />
    </article>
  );
}

function collectIds(nodes: OutlineNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectIds(node.children)]);
}

/* ------------------------------------------------------------------ 제목 */

/** 1단계가 h3다. 화면에는 이미 매치업 이름이 h1·h2로 있다. */
const HEADING_TAG = ["h3", "h4", "h5", "h6"] as const;

function NodeView({
  node,
  notes,
  section,
  resolveLink,
  collapsed,
  onToggle,
}: {
  node: OutlineNode;
  notes: Footnote[];
  /** 섹션 노드일 때만 있다. 스티커·편집 버튼·빈 안내가 여기서 온다. */
  section?: DocSection;
  resolveLink: WikiLinkResolver;
  collapsed: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  const Heading = HEADING_TAG[Math.min(node.level, HEADING_TAG.length) - 1];
  const isCollapsed = collapsed.has(node.id);
  const isEmpty = !node.lead.trim() && node.children.length === 0;

  return (
    <section
      className={styles.node}
      id={node.id}
      data-level={node.level}
      data-current={section?.current || undefined}
    >
      <div className={styles.head}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!isCollapsed}
          aria-controls={`${node.id}--body`}
          onClick={() => onToggle(node.id)}
        >
          <span aria-hidden="true">{isCollapsed ? "▸" : "▾"}</span>
          <span className="sr-only">
            {stripInlineMarkup(node.title)} {isCollapsed ? "펼치기" : "접기"}
          </span>
        </button>

        {section?.badgePosition !== "after" && section?.badge}

        <Heading className={styles.title}>
          <span className={`mono ${styles.number}`}>{node.number}</span>
          <span>{stripInlineMarkup(node.title)}</span>
        </Heading>

        {section?.badgePosition === "after" && section.badge}

        {section?.current && <span className={`mono ${styles.currentLabel}`}>현재 선택</span>}

        {(section?.tools || section?.action) && (
          <div className={styles.controls}>
            {section?.tools}
            {section?.action}
          </div>
        )}
      </div>

      <div id={`${node.id}--body`} className={styles.body} hidden={isCollapsed}>
        {node.lead.trim() && (
          <MarkdownBody text={node.lead} footnotes={notes} resolveLink={resolveLink} />
        )}

        {isEmpty && section?.empty}

        {node.children.map((child) => (
          <NodeView
            key={child.id}
            node={child}
            notes={notes}
            resolveLink={resolveLink}
            collapsed={collapsed}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 목차 */

/**
 * 문서 우측 하단에 붙는 목차 단추와 팝업.
 *
 * 목차를 글 맨 위에 펼쳐 두면 문서를 열 때마다 본문이 한 화면 아래로 밀린다. 목차는
 * 늘 보고 있을 것이 아니라 **필요할 때 찾는 것**이라, 자리를 차지하지 않고 어디서든
 * 닿는 구석에 둔다.
 *
 * 화면에 고정(`fixed`)한다. 문서가 길어져도 스크롤을 되감지 않고 바로 열 수 있어야 한다.
 */
function TocCorner({
  nodes,
  onJump,
  onToggleAll,
  allCollapsed,
}: {
  nodes: OutlineNode[];
  onJump: (id: string) => void;
  onToggleAll: () => void;
  allCollapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥을 누르거나 Esc를 누르면 닫는다. 팝업을 닫는 두 가지 익숙한 방법이다.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.tocCorner} ref={rootRef}>
      {open && (
        <div className={styles.tocPopup} role="dialog" aria-label="목차">
          <div className={styles.tocHead}>
            <span className="sticker sticker--cobalt">목차</span>
            <button type="button" className={`sticker ${styles.tocToggle}`} onClick={onToggleAll}>
              {allCollapsed ? "모두 펼치기" : "모두 접기"}
            </button>
          </div>
          <TocList
            nodes={nodes}
            onJump={(id) => {
              onJump(id);
              setOpen(false);
            }}
          />
        </div>
      )}

      <button
        type="button"
        className={styles.tocButton}
        aria-expanded={open}
        aria-label="목차"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">☰</span>
      </button>
    </div>
  );
}

function TocList({ nodes, onJump }: { nodes: OutlineNode[]; onJump: (id: string) => void }) {
  return (
    <ol className={styles.tocList}>
      {nodes.map((node) => (
        <li key={node.id}>
          <a
            href={`#${encodeURIComponent(node.id)}`}
            className={styles.tocLink}
            onClick={(event) => {
              // 접혀 있을 수 있으므로 브라우저 기본 이동에 맡기지 않는다.
              event.preventDefault();
              onJump(node.id);
            }}
          >
            <span className={`mono ${styles.tocNumber}`}>{node.number}</span>
            <span>{stripInlineMarkup(node.title)}</span>
          </a>
          {node.children.length > 0 && <TocList nodes={node.children} onJump={onJump} />}
        </li>
      ))}
    </ol>
  );
}
