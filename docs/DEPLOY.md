# 배포

깨남.GG는 **Cloudflare Workers**에 올라간다.

- 운영 주소: <https://kkaenam.com> (`www`는 이쪽으로 넘어온다)
- Worker 이름: `kkaenam-gg`

## 왜 Workers인가

Next.js 앱을 정적 파일로만 내보내는 방법(`output: "export"`)도 있지만 쓰지 않았다.
상대법 문서가 **Cloudflare D1에 있고 요청마다 서버에서 읽기** 때문이다. 정적 배포에는
데이터베이스를 읽을 서버가 없다.

(전환 초기의 이유는 달랐다. 당시에는 사용자가 쓴 팁의 상세 경로
`/matchup/[position]/[champion]/tips/[tipId]`가 빌드 시점에 알 수 없는 id를 받아
정적 배포로는 404가 되는 것이 이유였다. 그 라우트는 위키 전환 2단계에서 사라졌지만,
D1을 쓰게 되면서 서버가 필요한 이유는 오히려 더 분명해졌다.)

그래서 `@opennextjs/cloudflare` 어댑터로 Next.js 서버를 Worker로 변환해 올린다.
Cloudflare가 현재 Next.js에 공식 권장하는 방식이다 (Pages의 Next.js 지원은 레거시).

## 구성 파일

| 파일 | 역할 |
| --- | --- |
| `wrangler.jsonc` | Worker 이름·진입점·정적 에셋 경로. `main`과 `assets.directory`는 변환 산출물의 경로라 바꾸지 않는다. |
| `open-next.config.ts` | Next.js → Worker 변환 설정. 서버에 저장할 상태가 없어 지금은 기본값이다. |
| `next.config.ts` 하단 | `initOpenNextCloudflareForDev()` — `next dev`에서도 Cloudflare 바인딩을 쓰기 위한 훅. |
| `.node-version` | Cloudflare CI가 쓸 Node 버전 고정. |

`compatibility_flags`의 두 값은 필수에 가깝다.

- `nodejs_compat` — Next 런타임이 쓰는 Node API를 Workers에서 쓰기 위해 필요하다.
- `global_fetch_strictly_public` — 앱이 자기 도메인으로 보내는 `fetch`를 공개 인터넷 경로로 돌린다.

## 자동 배포 (Workers Builds)

`main`에 push하면 Cloudflare가 알아서 빌드·배포한다. 최초 1회 연결만 대시보드에서 한다.

1. <https://dash.cloudflare.com> → **Compute (Workers)** → `kkaenam-gg` 선택
2. **Settings** 탭 → **Build** 섹션 → **Connect** 클릭
3. GitHub 계정을 연결하고 `TaejinUOS/kkaenam.GG` 저장소를 고른다
4. 빌드 설정을 아래로 채운다

   | 항목 | 값 |
   | --- | --- |
   | Git branch | `main` |
   | Build command | `npm run cf:build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | *(비워둔다)* |

5. 저장하면 이후 `git push`마다 자동 배포된다

> 저장소가 public이면 Cloudflare가 GitHub App 권한을 요구한다. 이 저장소에만
> 권한을 주는 편이 낫다 (Only select repositories).

## 수동 배포

자동 배포를 붙이기 전이거나, 급하게 올려야 할 때.

```bash
npm run cf:deploy
```

처음 한 번은 Cloudflare 로그인이 필요하다.

```bash
npx wrangler login
```

## 도메인

`wrangler.jsonc`의 `routes`가 커스텀 도메인을 정의한다. `custom_domain: true`라서
Cloudflare가 DNS 레코드와 인증서를 알아서 만든다. **대시보드에서 따로 만들지 않는다.**

| 주소 | 역할 |
| --- | --- |
| `kkaenam.com` | 정식 주소 |
| `www.kkaenam.com` | 받아서 apex로 301 이동 (`next.config.ts`의 `redirects()`) |

`workers.dev` 주소(`kkaenam-gg.taejin1472.workers.dev`)는 커스텀 도메인을 붙이면서
자동으로 꺼졌다. 되살리려면 `wrangler.jsonc`에 `"workers_dev": true`를 넣는다.
주소가 둘로 갈리면 검색 엔진이 같은 문서를 둘로 세므로 꺼진 채로 두는 편이 낫다.

## 데이터베이스는 따로 배포한다

**코드 배포는 D1 스키마를 바꾸지 않는다.** 마이그레이션을 추가했다면 배포와 별개로
직접 적용해야 하며, 잊으면 새 코드가 없는 표를 찾다가 운영에서 깨진다.

```bash
# 로컬에서 먼저 적용하고 확인
npx wrangler d1 migrations apply kkaenam-gg --local
npm run cf:preview

# 운영에 적용 (배포 전에 한다)
npx wrangler d1 migrations apply kkaenam-gg --remote
```

순서가 중요하다. **스키마를 먼저 적용하고 코드를 배포한다.** 반대로 하면 새 코드가
아직 없는 표를 읽는 구간이 생긴다.

적용 상태는 이렇게 확인한다.

```bash
npx wrangler d1 migrations list kkaenam-gg --remote
```

> `migrations/`에는 마이그레이션만 둔다. wrangler가 그 디렉터리의 `.sql`을 전부
> 마이그레이션으로 취급하므로, 시드처럼 한 번만 실행할 SQL은 `seeds/`에 두고
> `d1 execute --file`로 직접 넣는다.

## 배포 전 로컬 확인

Workers 런타임은 Node와 다르다. `next dev`에서 되던 게 배포 후 깨질 수 있으므로,
런타임에 관계된 코드를 건드렸다면 실제 Worker로 띄워 확인한다.

```bash
npm run cf:preview   # http://127.0.0.1:8788
```

## 롤백

배포가 잘못됐을 때 이전 버전으로 되돌린다.

```bash
npx wrangler deployments list
npx wrangler rollback <version-id>
```

## 알아둘 것

**사이트는 현재 읽기 전용이다.** 상대법 문서는 D1에 있고 열람은 동작하지만, 로그인과
편집이 아직 없다 (위키 전환 3·4단계). 시드 이관분 외에는 내용이 늘지 않는다.
`docs/HANDOFF.md` 2.1을 참고할 것.

**무료 요금제 한도**는 하루 10만 요청이다. 현재 트래픽 규모에서는 여유가 있다.

**`next/image`를 쓰는 곳이 없다.** 쓰게 되면 Workers에서 이미지 최적화가 동작하지 않아
별도 설정이 필요하니, 도입 전에 확인한다.
