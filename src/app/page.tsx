import { Suspense } from "react";

import { SelectionScreen } from "@/components/selection/SelectionScreen";
import { PATCH } from "@/data/champions";
import { buildSelectionData } from "@/data/selection";
import { DEFAULT_POSITION_SLUG } from "@/data/taxonomy";
import { getTaxonomy } from "@/lib/taxonomyStore";

/** 분류가 D1에 있으므로(마이그레이션 0004) 운영자가 고친 배치가 바로 보여야 한다. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = buildSelectionData(await getTaxonomy());

  return (
    // useSearchParams를 쓰는 화면이라 Suspense 경계가 필요하다.
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <SelectionScreen
        data={data}
        defaultPosition={DEFAULT_POSITION_SLUG}
        patch={PATCH}
      />
    </Suspense>
  );
}
