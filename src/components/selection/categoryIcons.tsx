import type { JSX, SVGProps } from "react";

/**
 * 포지션별 카테고리 포스터 우하단에 붙는 스티커 아이콘.
 * 블루프린트의 표창(암살자)/불꽃(메이지)/검(브루저) 스티커를 기준으로
 * 나머지 9개 카테고리도 같은 굵기·톤의 모노라인 아이콘으로 맞췄다.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function ShieldIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 19 6v5.5c0 4.7-3 8.1-7 9.5-4-1.4-7-4.8-7-9.5V6z" />
      <path d="M9 12l2 2 4.5-5" />
    </Base>
  );
}

function CrossedSwordsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 4l7 7" />
      <path d="M4 4l2.4-.4L7 6l-2.4 2.4L4 4z" fill="currentColor" stroke="none" />
      <path d="M20 4l-7 7" />
      <path d="M20 4l-2.4-.4L17 6l2.4 2.4L20 4z" fill="currentColor" stroke="none" />
      <path d="M6 20l12-12" />
      <path d="M18 8l2-2" />
    </Base>
  );
}

function DaggerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 19L17 7" />
      <path d="M17 7l3-3 1 1-3 3z" fill="currentColor" stroke="none" />
      <path d="M5 19l1.8-.5.5-1.8z" fill="currentColor" stroke="none" />
      <path d="M13 5l3 3" />
    </Base>
  );
}

function ClawIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 4c-1 5 0 11 3 17" />
      <path d="M12 3c-.6 5.4.4 11.4 3 18" />
      <path d="M18 4c.8 5-.2 11-3 17" />
    </Base>
  );
}

function SparkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2c0 4-1 6-4 9 3 0 5 1 4 9 0-4 1-6 4-9-3 0-5-1-4-9z" fill="currentColor" stroke="none" />
      <path d="M4 18l1.2 1.2M20 6l-1.2 1.2" />
    </Base>
  );
}

function ShurikenIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2l2.4 6.6L21 12l-6.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="var(--ink)" stroke="none" />
    </Base>
  );
}

function FlameIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2c1 3-2 4-2 7a4 4 0 108 0c0-2-1-3-2-4 .5 2-1 2.5-1.5 1C13.5 4 12 3 12 2z" fill="currentColor" stroke="none" />
      <path d="M8.5 14.5a3.5 3.5 0 007 0c0-2-1.5-3-2.5-4.5" />
    </Base>
  );
}

function SwordIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 18L17.5 6.5" />
      <path d="M17.5 6.5l2-2 1 1-2 2z" fill="currentColor" stroke="none" />
      <path d="M6 18l-1.8.6.6-1.8z" fill="currentColor" stroke="none" />
      <path d="M13 8l2 2" />
      <path d="M9.5 14.5l1.6 1.6" />
    </Base>
  );
}

function BowIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20L18 6" />
      <path d="M18 6h-5.5" />
      <path d="M18 6v5.5" />
      <path d="M4 20l2.4-.3.3-2.4z" fill="currentColor" stroke="none" />
    </Base>
  );
}

function HeartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path
        d="M12 20S3.5 14.6 3.5 8.9 8 4 12 8c4-4 8.5-.9 8.5.9C20.5 14.6 12 20 12 20z"
        fill="currentColor"
        stroke="none"
      />
    </Base>
  );
}

function HookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 3v9a4 4 0 008 0" />
      <path d="M9 21l6-9" />
      <circle cx="9" cy="3" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

function ChaosIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 8c0-2.5 2.2-4.5 5-4.5 3 0 5 1.8 5 4.2 0 3-4 3-4 6" />
      <circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M4 4l1.4 1.4M20 4l-1.4 1.4" />
    </Base>
  );
}

const CATEGORY_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  "top/tank": ShieldIcon,
  "top/bruiser": CrossedSwordsIcon,
  "top/damage": DaggerIcon,
  "jungle/ad": ClawIcon,
  "jungle/ap": SparkIcon,
  "mid/assassin": ShurikenIcon,
  "mid/mage": FlameIcon,
  "mid/bruiser-adc": SwordIcon,
  "adc/adc": BowIcon,
  "support/mom": HeartIcon,
  "support/dad": HookIcon,
  "support/wtf": ChaosIcon,
};

type CategoryIconProps = IconProps & { positionSlug: string; categorySlug: string };

export function CategoryIcon({ positionSlug, categorySlug, ...props }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[`${positionSlug}/${categorySlug}`] ?? ShurikenIcon;
  return <Icon {...props} />;
}
