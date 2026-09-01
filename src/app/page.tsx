import { Suspense } from "react";

import { SelectionScreen } from "@/components/selection/SelectionScreen";
import { PATCH } from "@/data/champions";
import { buildSelectionData } from "@/data/selection";
import { DEFAULT_POSITION_SLUG } from "@/data/taxonomy";

export default function HomePage() {
  const data = buildSelectionData();

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
