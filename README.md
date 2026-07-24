# MADNESS: UNDERDOG 상태창 이미지 생성기 (PNG)

크랙(캐릭터 채팅)에서 `![](주소)` 로 불러오는 **동적 상태창 이미지**입니다.
주소의 쿼리만 바꾸면 STATUS / STATE / DAMAGE / INVENTORY 값이 실시간으로 그려집니다.

크랙은 SVG 이미지를 렌더링하지 않으므로, 이 함수는 내부에서 SVG 를 만든 뒤
**resvg-wasm 으로 PNG 로 변환**해서 반환합니다. 즉 결과물은 `<>` 가 전혀 없는
진짜 PNG 이미지라 어디서든 표시됩니다.

배경(박스 없는 이미지) 위에 함수가 직접 보라 하이라이트 박스 + 텍스트를 그립니다.
값이 없는 칸은 그리지 않습니다.

---

## 1. 레포 구성 (GitHub 에 이대로 올리기)

```
/
├─ functions/
│   └─ api/
│       └─ status.js       ← 메인 함수 (건드릴 필요 없음)
├─ lib/
│   ├─ render.js           ← SVG 빌더 (좌표/디자인은 여기서 조정)
│   ├─ resvg.mjs           ← resvg 라이브러리 (그대로 둠)
│   └─ resvg.wasm          ← resvg 엔진 바이너리 (그대로 둠)
├─ font.otf                ← 한글 폰트 (그대로 둠, 필요시 교체)
├─ bg.png                  ← ★박스 없는 배경 이미지 (직접 넣기)★
└─ index.html              ← (선택) 주소 생성 도구 페이지
```

> **직접 넣어야 하는 건 `bg.png` 하나뿐**입니다. 반드시 **박스가 없는 배경**을
> `bg.png` 라는 이름으로 루트에 두세요. 나머지 파일은 그대로 올리면 됩니다.
> (기준 해상도 1024×620. 크기가 달라도 비율만 같으면 자동으로 맞춰집니다.)

---

## 2. Cloudflare Pages 배포

1. 위 파일들을 GitHub 레포에 올린다.
   - `font.otf`, `lib/resvg.wasm` 은 용량이 있는 바이너리라, GitHub 웹에서 올릴 땐
     **드래그&드롭**으로 업로드하세요.
2. Cloudflare 대시보드 → **Workers & Pages → Create → Pages → Connect to Git**.
3. 레포 선택 후 빌드 설정:
   - **Framework preset**: `None`
   - **Build command**: 비워둠
   - **Build output directory**: `/`
4. **Save and Deploy**.
5. 배포되면 API 주소는 `https://<프로젝트>.pages.dev/api/status` 입니다.

> Cloudflare Pages 는 함수의 `.wasm` import 를 자동으로 처리합니다(별도 빌드 명령 불필요).

---

## 3. 사용법

### 파라미터

| 파라미터 | 의미 | 개수 | 예시 |
|---|---|---|---|
| `status` | 현재 상황 | 1개 | `전투 중` |
| `state` | 상태 | 1개 | `중상` |
| `damage` | 손상 부위 | 최대 5개, `.` 로 구분 | `좌측 전완 결손.늑골 3개 파손.경추 봉합 불안정` |
| `inventory` | 소지품 | 최대 5개, `.` 로 구분 | `구형 리볼버.탄창 2개.붕대.진통제.식별표` |

값을 넣지 않은 파라미터/칸은 그려지지 않습니다.

### 크랙에 삽입

```
![](https://<프로젝트>.pages.dev/api/status?status=전투 중&state=중상&damage=좌측 전완 결손.늑골 3개 파손&inventory=구형 리볼버.붕대)
```

> `index.html` 도구를 쓰면(배포 후 `https://<프로젝트>.pages.dev/` 접속) 값을 입력만 하면
> 삽입용 주소를 자동으로 만들어 주고 미리보기도 보여줍니다.

---

## 4. 위치·디자인 조정

`lib/render.js` 상단의 두 블록만 고치면 됩니다.

- **`COORDS`** — 각 필드 위치. `x`(왼쪽), `cy`(세로 중앙), `font`(글자 크기),
  `maxW`(넘으면 글자 자동 축소), 리스트는 `rows`(각 칸의 세로 위치).
  숫자는 1024×620 기준 픽셀이며 실제 이미지 크기에 맞춰 자동 스케일됩니다.
- **`STYLE`** — 박스 색(`boxFill`), 글자색(`textColor`), 여백 등.

예) INVENTORY 목록을 3px 내리려면 `inventory.rows` 의 각 값에 +3.

---

## 5. 폰트에 대해

- `font.otf` 는 **Noto Sans CJK KR (Bold)** 를 한글 + 영문 + 기본 기호로 추린 경량본
  (약 1.8MB, OFL 라이선스) 입니다.
- **한자(漢字)나 특수 문자**가 필요하면 더 큰 한글/CJK 폰트로 교체하세요. 교체 시,
  `functions/api/status.js` 의 `FONT_FAMILY` 값과 `lib/render.js` 의 `STYLE.fontFamily`
  를 새 폰트의 실제 패밀리명으로 맞춰야 합니다. (같은 값이어야 함)
- 이모지(😀 등)는 색상 이모지라 이 폰트로는 렌더링되지 않습니다.

---

## 6. 참고 / 주의

- **캐시**: 같은 주소는 최대 10분(`max-age=600`) 캐시될 수 있습니다. 값이 다르면
  다른 주소이므로 즉시 새로 그려집니다. 배경을 바꾼 뒤 반영이 늦으면 주소 끝에
  `&_v=2` 같은 값을 붙여 새 주소로 요청하세요. 캐시 시간은 `status.js` 의
  `cache-control` 에서 조정.
- **배경 base64 인라인**: SVG→PNG 변환 엔진이 배경을 읽을 수 있도록, 함수가 배경을
  받아 SVG 안에 base64 로 심은 뒤 렌더링합니다.
- **문제 해결 (배포가 wasm 에서 실패할 때)**: 드물게 `.wasm` 로컬 import 번들링이
  안 되는 환경이면, npm 방식으로 바꿀 수 있습니다 —
  레포 루트에 `package.json`(의존성 `@resvg/resvg-wasm`)을 두고, `status.js` 의 import 를
  `from "@resvg/resvg-wasm"` / `from "@resvg/resvg-wasm/index_bg.wasm"` 로 변경.
