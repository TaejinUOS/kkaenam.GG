-- 시드 Tip을 위키 문서로 옮긴 결과. scripts/seed-wiki.ts가 만든다.
-- 직접 고치지 말고 스크립트를 고쳐 다시 생성한다.

-- 이관분의 작성자로 쓰는 시스템 계정.
INSERT OR IGNORE INTO users (id, provider, provider_id, name, email, role, created_at)
VALUES ('user-system', 'system', 'seed', '깨남.COM', NULL, 'admin', '2026-09-02T00:00:00+09:00');

-- aatrox — Tip 2개, Me 섹션 0개
INSERT INTO wiki_docs (id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
VALUES ('doc-c-aatrox', 'aatrox', '다르킨의 검(Q) 세 번째만 피하면 됩니다

아트록스의 Q는 세 번 연속으로 쓰이고, 각 타격의 가장자리에 맞으면 추가 피해와 함께 공중에 뜹니다. 특히 세 번째 Q가 가장 크게 들어가니, 두 번째까지는 거리를 두고 버티다가 세 번째 범위에서 확실히 빠지세요. Q 쿨타임은 1레벨 14초로 길어, 콤보를 흘리면 그 구간이 그대로 반격 기회가 됩니다.

지옥사슬(W)에 걸리면 중앙에서 벗어나세요

지옥사슬(W)은 적중 후 일정 시간 안에 사슬 중심에서 벗어나지 못하면 끌려옵니다. 걸린 즉시 판단해서 바깥으로 뛰어야 하고, 그대로 딜교환을 받으면 Q 콤보까지 전부 맞습니다. 이동기가 없다면 W가 빠진 20초를 노려 앞으로 나가는 편이 낫습니다.', 1, '16.17', 'guarded', '2026-09-02T00:00:00+09:00', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-aatrox-general', 'doc-c-aatrox', NULL, 0, '다르킨의 검(Q) 세 번째만 피하면 됩니다

아트록스의 Q는 세 번 연속으로 쓰이고, 각 타격의 가장자리에 맞으면 추가 피해와 함께 공중에 뜹니다. 특히 세 번째 Q가 가장 크게 들어가니, 두 번째까지는 거리를 두고 버티다가 세 번째 범위에서 확실히 빠지세요. Q 쿨타임은 1레벨 14초로 길어, 콤보를 흘리면 그 구간이 그대로 반격 기회가 됩니다.

지옥사슬(W)에 걸리면 중앙에서 벗어나세요

지옥사슬(W)은 적중 후 일정 시간 안에 사슬 중심에서 벗어나지 못하면 끌려옵니다. 걸린 즉시 판단해서 바깥으로 뛰어야 하고, 그대로 딜교환을 받으면 Q 콤보까지 전부 맞습니다. 이동기가 없다면 W가 빠진 20초를 노려 앞으로 나가는 편이 낫습니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);

-- ahri — Tip 4개, Me 섹션 3개
INSERT INTO wiki_docs (id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
VALUES ('doc-c-ahri', 'ahri', '매혹(E)이 빠진 12초가 전부입니다

아리의 하드 CC는 매혹(E) 하나뿐이고 쿨타임이 레벨과 무관하게 12초로 고정입니다. 매혹이 빗나간 순간부터 12초 동안은 아리가 먼저 걸 수 있는 수가 없다고 봐도 됩니다. 이 구간에 라인을 밀어붙이거나 정글과 함께 다이브를 노리세요. 반대로 매혹이 살아 있는 동안 사거리 975 안에서 직선으로 움직이면 그대로 잡힙니다. 미니언 뒤나 측면으로 각도를 계속 바꿔 주세요.

구슬(Q)은 돌아올 때가 더 아픕니다

현혹의 구슬(Q)은 나갈 때 마법 피해, 돌아올 때 고정 피해를 줍니다. 대부분 나가는 구슬만 피하고 제자리에 서 있다가 복귀 구슬을 그대로 맞습니다. 구슬이 아리 쪽으로 되돌아가는 직선을 미리 계산해 옆으로 한 번 더 빠져 주세요. 쿨타임이 7초라 라인전 내내 반복되는 손해라 체감이 큽니다.

6레벨 이후 혼령 질주(R) 3연속 돌진을 계산하세요

혼령 질주(R)는 세 번 돌진하고 쿨타임이 140초입니다. 6레벨을 찍은 아리는 매혹만 맞히면 R로 따라붙어 마무리까지 갑니다. 아리가 R을 쓴 뒤에는 140초 동안 로밍과 생존력이 크게 떨어지니, 그 구간에 미드를 밀고 정글 오브젝트를 같이 가져오는 편이 이득입니다. 와드로 아리가 사라진 시점을 공유해 주세요.

라인을 짧게 유지하면 매혹 각이 사라집니다

아리는 여우불(W)로 라인을 빠르게 밀고 로밍을 갑니다. 라인이 길어질수록 매혹 사거리 975 안에서 잡히는 각이 늘어나니, 우리 타워 근처에서 받아먹는 구도를 만드는 편이 안전합니다. 라인이 짧으면 아리가 들어와서 매혹을 쓰는 순간 타워 사거리에 걸리기 때문에 시도 자체가 줄어듭니다.', 1, '16.17', 'guarded', '2026-09-02T00:00:00+09:00', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-ahri-general', 'doc-c-ahri', NULL, 0, '매혹(E)이 빠진 12초가 전부입니다

아리의 하드 CC는 매혹(E) 하나뿐이고 쿨타임이 레벨과 무관하게 12초로 고정입니다. 매혹이 빗나간 순간부터 12초 동안은 아리가 먼저 걸 수 있는 수가 없다고 봐도 됩니다. 이 구간에 라인을 밀어붙이거나 정글과 함께 다이브를 노리세요. 반대로 매혹이 살아 있는 동안 사거리 975 안에서 직선으로 움직이면 그대로 잡힙니다. 미니언 뒤나 측면으로 각도를 계속 바꿔 주세요.

구슬(Q)은 돌아올 때가 더 아픕니다

현혹의 구슬(Q)은 나갈 때 마법 피해, 돌아올 때 고정 피해를 줍니다. 대부분 나가는 구슬만 피하고 제자리에 서 있다가 복귀 구슬을 그대로 맞습니다. 구슬이 아리 쪽으로 되돌아가는 직선을 미리 계산해 옆으로 한 번 더 빠져 주세요. 쿨타임이 7초라 라인전 내내 반복되는 손해라 체감이 큽니다.

6레벨 이후 혼령 질주(R) 3연속 돌진을 계산하세요

혼령 질주(R)는 세 번 돌진하고 쿨타임이 140초입니다. 6레벨을 찍은 아리는 매혹만 맞히면 R로 따라붙어 마무리까지 갑니다. 아리가 R을 쓴 뒤에는 140초 동안 로밍과 생존력이 크게 떨어지니, 그 구간에 미드를 밀고 정글 오브젝트를 같이 가져오는 편이 이득입니다. 와드로 아리가 사라진 시점을 공유해 주세요.

라인을 짧게 유지하면 매혹 각이 사라집니다

아리는 여우불(W)로 라인을 빠르게 밀고 로밍을 갑니다. 라인이 길어질수록 매혹 사거리 975 안에서 잡히는 각이 늘어나니, 우리 타워 근처에서 받아먹는 구도를 만드는 편이 안전합니다. 라인이 짧으면 아리가 들어와서 매혹을 쓰는 순간 타워 사거리에 걸리기 때문에 시도 자체가 줄어듭니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);
INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
VALUES ('doc-c-ahri', 'twistedfate', '골드 카드가 매혹보다 사거리가 짧으니 먼저 맞으면 집니다. W를 미리 돌려 두고 아리가 매혹을 쓴 직후에 들어가 스턴을 먼저 꽂으세요. 매혹 쿨 12초 동안은 카드 선택이 훨씬 편해집니다.

카드 고르는 동안 제자리에 서게 되는 게 문제입니다. 파란 카드를 뽑을 때는 구슬 복귀 경로 밖으로 미리 이동한 뒤 선택하세요.

트페는 라인을 짧게 두면 성장이 늦습니다. 대신 아리가 로밍을 가면 R로 같은 타이밍에 다른 라인을 여세요. 맞로밍이 트페의 이득 구간입니다.', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-ahri-me-twistedfate', 'doc-c-ahri', 'twistedfate', 0, '골드 카드가 매혹보다 사거리가 짧으니 먼저 맞으면 집니다. W를 미리 돌려 두고 아리가 매혹을 쓴 직후에 들어가 스턴을 먼저 꽂으세요. 매혹 쿨 12초 동안은 카드 선택이 훨씬 편해집니다.

카드 고르는 동안 제자리에 서게 되는 게 문제입니다. 파란 카드를 뽑을 때는 구슬 복귀 경로 밖으로 미리 이동한 뒤 선택하세요.

트페는 라인을 짧게 두면 성장이 늦습니다. 대신 아리가 로밍을 가면 R로 같은 타이밍에 다른 라인을 여세요. 맞로밍이 트페의 이득 구간입니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);
INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
VALUES ('doc-c-ahri', 'yasuo', '바람 장막(W)은 매혹과 현혹의 구슬을 모두 막습니다. 다만 장막 쿨이 매혹보다 기니 초반에는 아껴 두고, 아리가 매혹을 쓴 뒤 들어가는 편이 안전합니다.', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-ahri-me-yasuo', 'doc-c-ahri', 'yasuo', 0, '바람 장막(W)은 매혹과 현혹의 구슬을 모두 막습니다. 다만 장막 쿨이 매혹보다 기니 초반에는 아껴 두고, 아리가 매혹을 쓴 뒤 들어가는 편이 안전합니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);
INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
VALUES ('doc-c-ahri', 'zed', '살아있는 그림자(W)를 매혹 회피용으로 남겨 두세요. 매혹이 날아오는 순간 W로 위치를 바꾸면 그대로 흘릴 수 있고, 이후 12초가 제드의 솔로킬 구간입니다.', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-ahri-me-zed', 'doc-c-ahri', 'zed', 0, '살아있는 그림자(W)를 매혹 회피용으로 남겨 두세요. 매혹이 날아오는 순간 W로 위치를 바꾸면 그대로 흘릴 수 있고, 이후 12초가 제드의 솔로킬 구간입니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);

-- blitzcrank — Tip 1개, Me 섹션 0개
INSERT INTO wiki_docs (id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
VALUES ('doc-c-blitzcrank', 'blitzcrank', '미니언을 몸으로 끼고 서면 로켓 손(Q)이 무의미해집니다

로켓 손(Q)은 사거리 1079에 쿨타임 20초이고, 경로상 첫 대상만 잡습니다. 원거리 미니언 뒤에 몸을 겹쳐 서 있으면 그랩 각이 아예 나오지 않습니다. 블리츠크랭크가 Q를 흘린 20초가 바텀 라인을 밀거나 다이브를 노릴 수 있는 구간이니, 서포터와 함께 그 타이밍을 소리 내어 공유하세요.', 1, '16.17', 'guarded', '2026-09-02T00:00:00+09:00', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-blitzcrank-general', 'doc-c-blitzcrank', NULL, 0, '미니언을 몸으로 끼고 서면 로켓 손(Q)이 무의미해집니다

로켓 손(Q)은 사거리 1079에 쿨타임 20초이고, 경로상 첫 대상만 잡습니다. 원거리 미니언 뒤에 몸을 겹쳐 서 있으면 그랩 각이 아예 나오지 않습니다. 블리츠크랭크가 Q를 흘린 20초가 바텀 라인을 밀거나 다이브를 노릴 수 있는 구간이니, 서포터와 함께 그 타이밍을 소리 내어 공유하세요.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);

-- caitlyn — Tip 1개, Me 섹션 0개
INSERT INTO wiki_docs (id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
VALUES ('doc-c-caitlyn', 'caitlyn', '덫(W)을 밟는 순간 헤드샷까지 따라옵니다

케이틀린의 라인전은 덫(W)으로 서 있을 자리를 지우는 데서 시작합니다. 덫에 걸리면 이동 불가와 함께 강화 평타가 확정으로 들어오고, 이어서 90구경 투망(E)까지 붙습니다. CS를 먹을 때 덫이 깔린 자리를 피해 각도를 바꾸고, 부시 입구는 항상 덫이 있다고 가정하세요. 사거리 1250의 Q를 피하려면 미니언 라인과 겹치지 않게 서는 것도 중요합니다.', 1, '16.17', 'guarded', '2026-09-02T00:00:00+09:00', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-caitlyn-general', 'doc-c-caitlyn', NULL, 0, '덫(W)을 밟는 순간 헤드샷까지 따라옵니다

케이틀린의 라인전은 덫(W)으로 서 있을 자리를 지우는 데서 시작합니다. 덫에 걸리면 이동 불가와 함께 강화 평타가 확정으로 들어오고, 이어서 90구경 투망(E)까지 붙습니다. CS를 먹을 때 덫이 깔린 자리를 피해 각도를 바꾸고, 부시 입구는 항상 덫이 있다고 가정하세요. 사거리 1250의 Q를 피하려면 미니언 라인과 겹치지 않게 서는 것도 중요합니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);

-- leesin — Tip 2개, Me 섹션 0개
INSERT INTO wiki_docs (id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
VALUES ('doc-c-leesin', 'leesin', '음파(Q)를 흘리면 갱킹은 끝난 겁니다

리 신의 갱킹은 음파(Q) 적중 여부로 갈립니다. 사거리 1100에 쿨타임은 1레벨 기준 10초입니다. Q가 빗나가면 남은 진입 수단은 와드 점프뿐이라 위협이 크게 줄어듭니다. 부시와 강가 방향으로 직선을 내주지 말고, 미니언을 사이에 두면 음파가 미니언에 막힙니다. Q를 흘린 뒤 10초는 라인을 밀어도 되는 구간입니다.

용의 분노(R)는 벽을 등지고 서면 무력해집니다

리 신의 R은 대상을 뒤로 밀어냅니다. 한타에서 뒤로 밀려 아군과 분리되는 게 가장 큰 손해이므로, 벽이나 아군 탱커를 등지고 서면 킥으로 얻을 수 있는 이득이 사라집니다. R 쿨타임은 1레벨 110초로 길어, 한 번 흘리면 그 교전은 훨씬 편해집니다.', 1, '16.17', 'guarded', '2026-09-02T00:00:00+09:00', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-leesin-general', 'doc-c-leesin', NULL, 0, '음파(Q)를 흘리면 갱킹은 끝난 겁니다

리 신의 갱킹은 음파(Q) 적중 여부로 갈립니다. 사거리 1100에 쿨타임은 1레벨 기준 10초입니다. Q가 빗나가면 남은 진입 수단은 와드 점프뿐이라 위협이 크게 줄어듭니다. 부시와 강가 방향으로 직선을 내주지 말고, 미니언을 사이에 두면 음파가 미니언에 막힙니다. Q를 흘린 뒤 10초는 라인을 밀어도 되는 구간입니다.

용의 분노(R)는 벽을 등지고 서면 무력해집니다

리 신의 R은 대상을 뒤로 밀어냅니다. 한타에서 뒤로 밀려 아군과 분리되는 게 가장 큰 손해이므로, 벽이나 아군 탱커를 등지고 서면 킥으로 얻을 수 있는 이득이 사라집니다. R 쿨타임은 1레벨 110초로 길어, 한 번 흘리면 그 교전은 훨씬 편해집니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);

-- yone — Tip 1개, Me 섹션 0개
INSERT INTO wiki_docs (id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
VALUES ('doc-c-yone', 'yone', '영혼해방(E)의 22초, 돌아갈 자리를 기억하세요

요네의 E는 몸에서 영혼이 분리되고, 일정 시간 뒤 원래 자리로 강제로 돌아갑니다. 쿨타임은 1레벨 기준 22초입니다. 요네가 E로 들어온 순간 그가 돌아갈 지점이 어디인지 확인하고, 그 경로에 CC를 깔아 두세요. 돌아가는 순간은 무적이 아니라 그냥 이동이라 그대로 맞습니다. E가 빠진 22초 동안은 요네가 진입 후 빠져나갈 방법이 사실상 없습니다.', 1, '16.17', 'guarded', '2026-09-02T00:00:00+09:00', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-yone-general', 'doc-c-yone', NULL, 0, '영혼해방(E)의 22초, 돌아갈 자리를 기억하세요

요네의 E는 몸에서 영혼이 분리되고, 일정 시간 뒤 원래 자리로 강제로 돌아갑니다. 쿨타임은 1레벨 기준 22초입니다. 요네가 E로 들어온 순간 그가 돌아갈 지점이 어디인지 확인하고, 그 경로에 CC를 깔아 두세요. 돌아가는 순간은 무적이 아니라 그냥 이동이라 그대로 맞습니다. E가 빠진 22초 동안은 요네가 진입 후 빠져나갈 방법이 사실상 없습니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);

-- zed — Tip 3개, Me 섹션 3개
INSERT INTO wiki_docs (id, champion_slug, general, revision, patch, edit_policy, created_at, updated_at, updated_by)
VALUES ('doc-c-zed', 'zed', '살아있는 그림자(W)가 빠진 20초가 압박 구간입니다

제드의 도주기이자 진입기는 살아있는 그림자(W) 하나입니다. 쿨타임이 1레벨 기준 20초로 길기 때문에, 제드가 W를 라인 클리어나 견제에 쓴 순간부터 약 20초 동안은 도망칠 수단이 없습니다. 이 구간에 정글을 부르거나 직접 들어가 압박하세요. 반대로 W가 살아 있을 때 무리하게 들어가면 그림자로 흘리고 역으로 딜교환을 내줍니다.

표창(Q)이 빠진 6초를 노리세요

예리한 표창(Q)은 쿨타임 6초에 사거리 900입니다. 제드의 견제 대미지는 대부분 여기서 나오고, 그림자와 겹쳐 맞으면 피해가 커집니다. Q가 빠진 6초 동안은 CS를 편하게 먹을 수 있는 구간이니 이때 앞으로 나가세요. 그림자와 본체가 만드는 직선이 겹치는 위치에는 서지 않는 것만 지켜도 라인전이 훨씬 편해집니다.

죽음의 표식(R)은 그림자 위치를 보고 피합니다

R로 진입한 제드는 표식이 터지기 전에 반드시 데미지를 넣어야 합니다. 이때 제드 본체와 그림자가 만드는 위치를 보고, 두 지점이 겹쳐 딜이 두 번 들어오는 각을 피해 움직이세요. 정화나 방어 아이템은 표식이 터지는 타이밍에 맞춰 쓰는 편이 좋습니다. R 쿨타임은 120초라 한 번 흘리면 한동안 안전합니다.', 1, '16.17', 'guarded', '2026-09-02T00:00:00+09:00', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-zed-general', 'doc-c-zed', NULL, 0, '살아있는 그림자(W)가 빠진 20초가 압박 구간입니다

제드의 도주기이자 진입기는 살아있는 그림자(W) 하나입니다. 쿨타임이 1레벨 기준 20초로 길기 때문에, 제드가 W를 라인 클리어나 견제에 쓴 순간부터 약 20초 동안은 도망칠 수단이 없습니다. 이 구간에 정글을 부르거나 직접 들어가 압박하세요. 반대로 W가 살아 있을 때 무리하게 들어가면 그림자로 흘리고 역으로 딜교환을 내줍니다.

표창(Q)이 빠진 6초를 노리세요

예리한 표창(Q)은 쿨타임 6초에 사거리 900입니다. 제드의 견제 대미지는 대부분 여기서 나오고, 그림자와 겹쳐 맞으면 피해가 커집니다. Q가 빠진 6초 동안은 CS를 편하게 먹을 수 있는 구간이니 이때 앞으로 나가세요. 그림자와 본체가 만드는 직선이 겹치는 위치에는 서지 않는 것만 지켜도 라인전이 훨씬 편해집니다.

죽음의 표식(R)은 그림자 위치를 보고 피합니다

R로 진입한 제드는 표식이 터지기 전에 반드시 데미지를 넣어야 합니다. 이때 제드 본체와 그림자가 만드는 위치를 보고, 두 지점이 겹쳐 딜이 두 번 들어오는 각을 피해 움직이세요. 정화나 방어 아이템은 표식이 터지는 타이밍에 맞춰 쓰는 편이 좋습니다. R 쿨타임은 120초라 한 번 흘리면 한동안 안전합니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);
INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
VALUES ('doc-c-zed', 'ahri', '매혹(E)은 제드가 W로 이동한 뒤 착지 지점을 노려 쓰세요. 그림자가 없는 20초 동안은 매혹 한 번이 그대로 킬로 이어집니다.', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-zed-me-ahri', 'doc-c-zed', 'ahri', 0, '매혹(E)은 제드가 W로 이동한 뒤 착지 지점을 노려 쓰세요. 그림자가 없는 20초 동안은 매혹 한 번이 그대로 킬로 이어집니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);
INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
VALUES ('doc-c-zed', 'twistedfate', '골드 카드로 그림자 복귀를 끊는 게 핵심입니다. 제드가 W로 들어온 직후 스턴을 맞히면 그림자로 돌아가지 못하고 그대로 녹습니다.', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-zed-me-twistedfate', 'doc-c-zed', 'twistedfate', 0, '골드 카드로 그림자 복귀를 끊는 게 핵심입니다. 제드가 W로 들어온 직후 스턴을 맞히면 그림자로 돌아가지 못하고 그대로 녹습니다.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);
INSERT INTO wiki_sections (doc_id, me_slug, body, updated_at, updated_by)
VALUES ('doc-c-zed', 'yasuo', '바람 장막(W)으로 표창을 막으면 R 표식 피해량이 크게 줄어듭니다. 제드가 R로 들어오는 순간 장막을 제드 본체 방향이 아니라 그림자 방향으로 펴세요.', '2026-09-02T00:00:00+09:00', 'user-system');
INSERT INTO wiki_edits (id, doc_id, me_slug, base_revision, body, summary, status, author, created_at, accepted_via, reviewed_at, reviewer, review_note, revision)
VALUES ('edit-doc-c-zed-me-yasuo', 'doc-c-zed', 'yasuo', 0, '바람 장막(W)으로 표창을 막으면 R 표식 피해량이 크게 줄어듭니다. 제드가 R로 들어오는 순간 장막을 제드 본체 방향이 아니라 그림자 방향으로 펴세요.', '시드 Tip 이관', 'accepted', 'user-system', '2026-09-02T00:00:00+09:00', 'admin', NULL, NULL, NULL, 1);
