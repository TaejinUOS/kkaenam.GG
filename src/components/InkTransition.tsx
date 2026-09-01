"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import styles from "./InkTransition.module.css";

/** 블루프린트 7장: 선택 지점에서 번지는 잉크 마스크 전환 시간. */
const INK_MS = 220;

type Origin = { x: number; y: number };

/**
 * 챔피언·카테고리 선택 시 잉크 마스크로 화면을 덮은 뒤 이동한다.
 *
 * PRD FR-06 "중복 클릭으로 화면 이동이 여러 번 실행되지 않아야 한다"를 위해 진행 중에는
 * 이후 호출을 모두 무시하고, 애니메이션 감소 환경에서는 마스크 없이 즉시 이동한다.
 */
export function useInkTransition() {
  const router = useRouter();
  const [origin, setOrigin] = useState<Origin | null>(null);
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const navigate = useCallback(
    (href: string, source?: Element | null) => {
      if (pending.current) return;
      pending.current = true;

      if (prefersReducedMotion() || !source) {
        router.push(href);
        return;
      }

      const rect = source.getBoundingClientRect();
      setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      timer.current = setTimeout(() => router.push(href), INK_MS);
    },
    [router],
  );

  const overlay = origin ? (
    <div
      className={styles.ink}
      aria-hidden="true"
      style={{ ["--x" as string]: `${origin.x}px`, ["--y" as string]: `${origin.y}px` }}
    />
  ) : null;

  return { navigate, overlay };
}
