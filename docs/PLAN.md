# WineMaster 프로젝트 계획서

> 와인을 체계적으로 공부하는 오픈소스 커리큘럼 + 검색 가능한 와인 지식 위키
> 작성일: 2026-10-20 · 상태: 초안 (v0.1)

---

## 1. 한 줄 정의

**WineMaster = "읽는 위키" + "따라가는 코스".**
지역·품종·와인 스타일·와이너리를 자유롭게 검색하는 지식 베이스이면서, 30개 챕터를 순서대로 읽고 체크하고 퀴즈를 통과하며 실력을 쌓는 학습 사이트다. 한국어가 원본이고 영어·일본어·중국어(간체) 번역판을 함께 제공한다.

## 2. 목표와 비목표

**목표**
- WSET L1→L2→L3 흐름을 뼈대로 한 30챕터 커리큘럼 (쉬운 한국어, 재미있게)
- 지역 / 품종 / 스타일(제품 종류) / 와이너리 / 용어집을 서로 연결한 위키
- 모든 지역 페이지에 지도, 모든 주요 페이지에 라이선스가 명확한 이미지
- 로그인 없이 바로 쓰는 진도·체크리스트·퀴즈 (브라우저에 저장)
- 4개 언어, 전문 검색(언어별)
- 흑백 기반의 절제되고 세련된 디자인

**비목표 (v1 기준)**
- 회원가입·서버 DB (v2에서 선택적 동기화 검토)
- 와인 가격·구매 정보, 평점 서비스
- WSET 공식 교재 내용 복제 (구조만 참고, 문장은 모두 자체 작성)

## 3. 기술 스택 (결정)

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Astro 5** (정적 사이트) | 콘텐츠 중심, MDX, 타입 있는 Content Collections, 필요한 곳만 JS(아일랜드) |
| 인터랙션 | **Preact** 아일랜드 | 퀴즈·체크박스·지도만 하이드레이션. 번들 작게 |
| 콘텐츠 | **MDX + YAML frontmatter** (Zod 스키마 검증) | 비개발자도 PR로 기여 가능, 빌드 시 오류 검출 |
| 스타일 | 직접 작성한 CSS (CSS 변수 + 소수의 유틸) | 템플릿 냄새 제거. Tailwind/UI 키트 미사용 |
| 검색 | **Pagefind** | 정적 빌드 후 인덱싱, 한/영/일/중 다국어 지원, 서버 불필요 |
| 지도 | **MapLibre GL JS + OpenFreeMap(또는 Protomaps) 타일 + 흑백 스타일** | API 키·과금 없음, 흑백 커스텀 스타일 가능. 산지 경계는 GeoJSON |
| 진도 저장 | `localStorage` (+ JSON 내보내기/가져오기) | 백엔드 없이 시작. v2에 Supabase 등 동기화 옵션 |
| 배포 | **GitHub Pages** (Actions) 또는 Cloudflare Pages | 무료, PR 미리보기(Cloudflare 선택 시) |
| 패키지 | pnpm, Node 22 LTS | |
| 품질 | TypeScript, ESLint, Prettier, `astro check`, 링크 검사, 이미지 라이선스 검사 스크립트 | |

> 지도는 구글맵 대신 오픈 지도를 기본으로 잡았다. 구글맵은 API 키·결제 계정이 필요하고 흑백 스타일링·오픈소스 재배포가 번거롭다. 원하면 나중에 교체 가능하도록 `<RegionMap>` 컴포넌트 하나로 감싼다.

## 4. 정보 구조 (사이트맵)

```
/{lang}/                       홈: 이어서 학습하기, 오늘의 카드, 검색
/{lang}/learn/                 커리큘럼 (30챕터, 진도 표시)
/{lang}/learn/{chapter}/       챕터 본문 + 체크포인트 + 챕터 퀴즈
/{lang}/wiki/regions/          국가 → 지역 → 세부 산지 (지도 인덱스)
/{lang}/wiki/regions/{slug}/
/{lang}/wiki/grapes/           품종 (색·원산지·스타일 필터)
/{lang}/wiki/grapes/{slug}/
/{lang}/wiki/styles/           와인 스타일/제품 종류 (스파클링, 주정강화 등)
/{lang}/wiki/wines/{slug}/     대표 와인(아이코닉 와인) 프로필
/{lang}/wiki/wineries/{slug}/  와이너리 역사
/{lang}/wiki/history/          와인의 역사 타임라인
/{lang}/glossary/              용어집 (A-Z / 가나다)
/{lang}/review/                복습: 틀린 문제, 플래시카드
/{lang}/progress/              내 진도, 내보내기/가져오기
```

`lang` = `ko`(기본) · `en` · `ja` · `zh`

## 5. 콘텐츠 모델

모든 엔티티는 **언어 무관한 slug**(영문 kebab-case)로 식별하고, 서로 slug로 참조한다. 언어별 본문은 같은 slug의 파일을 언어 폴더에 둔다.

```
content/
  regions/ko/bordeaux.mdx      regions/en/bordeaux.mdx ...
  grapes/ko/cabernet-sauvignon.mdx
  styles/ko/traditional-method-sparkling.mdx
  wines/ko/chateau-margaux.mdx
  wineries/ko/chateau-margaux.mdx
  chapters/ko/07-climate-and-terroir.mdx
  glossary/ko.yaml
  quizzes/07-climate-and-terroir.yaml    # 문제는 slug 기반, 문장은 언어별 키
data/
  geo/regions/*.geojson        # 산지 경계/포인트
  images.yaml                  # 이미지 출처·라이선스 레지스트리
```

**공통 frontmatter (언어 무관 필드는 `ko`만 원본으로 관리하고 빌드 시 병합)**

```yaml
# regions/ko/bordeaux.mdx
slug: bordeaux
name: 보르도
level: region            # country | region | subregion | appellation
parent: france
coords: [44.84, -0.58]   # 지도 중심
geo: data/geo/regions/bordeaux.geojson
climate: maritime
grapes: { red: [merlot, cabernet-sauvignon, cabernet-franc], white: [sauvignon-blanc, semillon] }
styles: [dry-red, sweet-white]
classification: [bordeaux-1855]
wineries: [chateau-margaux, chateau-latour]
chapters: [18]           # 이 지역을 다루는 챕터
hero: commons:File:Saint-Emilion_vineyards.jpg
translation: { status: source }   # source | machine | reviewed
```

```yaml
# grapes/ko/cabernet-sauvignon.mdx
slug: cabernet-sauvignon
name: 카베르네 소비뇽
color: red
origin: france
aliases: [Cab Sav]
parents: [cabernet-franc, sauvignon-blanc]
profile: { body: 4, acidity: 3, tannin: 5, alcohol: 4 }   # 1–5 (SAT 감각 맞춤)
aromas: [blackcurrant, cedar, mint, tobacco]
regions: [bordeaux, napa-valley, coonawarra, maipo-valley]
pairings: [grilled-red-meat, aged-cheese]
```

`styles`(제품 종류): 스틸 레드/화이트/로제, 전통 방식 스파클링, 탱크 방식 스파클링, 레이트 하베스트, 귀부, 아이스와인, 셰리, 포트, 마데이라, 오렌지 와인 등.
`wines`: "교과서에 나오는" 대표 와인 위주(라벨 이미지는 라이선스 확인된 것만).
`wineries`: 역사·인물·혁신 중심의 스토리.

**자동 연결**: 품종 페이지 하단에 "이 품종이 유명한 지역(지도)", 지역 페이지에 "이 지역의 주요 품종/와이너리/관련 챕터"를 역참조로 자동 생성한다. 하나만 써도 양방향으로 연결된다.

## 6. 커리큘럼 (30챕터 초안)

각 챕터: 10–15분 분량 · 3–6개 섹션 · 섹션별 "이해했어요" 체크 · 섹션 사이 1문항 확인 질문 · 챕터 끝 8–12문항 퀴즈(통과 기준 80%).

### Part 1. 와인과 친해지기 (WSET L1 범위)
1. **와인이란 무엇인가** – 포도가 와인이 되기까지 한 장 요약
2. **와인의 역사 ①** – 조지아 크베브리부터 로마, 수도원까지
3. **와인의 역사 ②** – 필록세라, 신세계의 등장, 오늘의 와인 지도
4. **와인의 종류 한눈에** – 스틸·스파클링·주정강화, 색과 당도로 분류하기
5. **맛보는 법 기초** – 보고, 맡고, 마시고: 테이스팅 5단계
6. **와인과 음식의 기본 원칙** – 단맛·산미·짠맛·감칠맛·매운맛과 와인의 상호작용
7. **보관·서빙·잔·온도** – 실전 서빙 가이드와 와인 결함 알아보기

### Part 2. 와인을 만드는 원리 (WSET L2 범위)
8. **포도나무의 일 년** – 생장 주기, 수확 시점이 맛을 결정하는 이유
9. **기후와 떼루아** – 서늘한 기후 vs 따뜻한 기후, 대륙성·해양성·지중해성
10. **포도밭 관리** – 수확량, 캐노피, 유기농·바이오다이나믹
11. **양조의 기본** – 화이트·레드·로제는 어떻게 다르게 만들까
12. **오크와 숙성** – 오크, 젖산 발효, 앙금 숙성, 병 숙성
13. **라벨 읽기** – 구세계 vs 신세계 라벨, 품질 등급(AOC·DOCG·VDP 등)

### Part 3. 꼭 알아야 할 품종
14. **국제 화이트 품종 ①** – 샤르도네, 소비뇽 블랑
15. **국제 화이트 품종 ②** – 리슬링, 피노 그리, 슈냉 블랑, 게뷔르츠트라미너, 비오니에
16. **국제 레드 품종 ①** – 카베르네 소비뇽, 메를로, 카베르네 프랑
17. **국제 레드 품종 ②** – 피노 누아, 시라/쉬라즈, 그르나슈
18. **지역 대표 품종** – 산조베제, 네비올로, 템프라니요, 말벡, 진판델, 피노타주 등

### Part 4. 세계 와인 산지 여행 (WSET L2→L3)
19. **프랑스 ① 보르도·남서부**
20. **프랑스 ② 부르고뉴·보졸레**
21. **프랑스 ③ 론·루아르·알자스·남프랑스**
22. **이탈리아** – 피에몬테, 토스카나, 베네토, 남부
23. **스페인·포르투갈**
24. **독일·오스트리아·동유럽**
25. **미국·캐나다**
26. **남미** – 칠레, 아르헨티나
27. **오세아니아·남아공** – 호주, 뉴질랜드, 남아프리카공화국
28. **떠오르는 산지와 아시아** – 그리스, 조지아, 영국, 중국, 일본, 한국

### Part 5. 특별한 와인과 전문가 테이스팅 (WSET L3)
29. **스파클링·스위트·주정강화** – 샴페인, 프로세코, 소테른, 토카이, 셰리, 포트, 마데이라
30. **SAT 체계적 테이스팅과 최종 평가** – 외관·향·맛·결론, 품질 판단, 종합 모의시험

> 각 Part 끝에 "파트 테스트"(누적 복습)를 두고, 30장 통과 시 수료 배지(로컬)를 준다.

## 7. 학습 메커니즘

**진도 상태 (localStorage, 키 `wm:v1:progress`)**

```ts
type Progress = {
  chapters: Record<string, {
    sectionsRead: string[];        // "이해했어요" 체크한 섹션 id
    checkpoints: Record<string, boolean>;  // 섹션 사이 확인 질문 통과 여부
    quiz?: { best: number; attempts: number; passedAt?: string };
  }>;
  wrongAnswers: { questionId: string; lastWrongAt: string; box: number }[]; // 간이 Leitner
  lang: 'ko' | 'en' | 'ja' | 'zh';
};
```

- **잠금 규칙**: 다음 챕터는 열람 가능(잠그지 않음)하되, "추천 경로" 배지는 이전 챕터 퀴즈 통과 시 표시. 강제 잠금은 학습 의욕을 떨어뜨리므로 쓰지 않는다.
- **체크포인트**: 섹션 사이 1문항. 틀리면 해당 섹션 하이라이트로 돌려보냄.
- **챕터 퀴즈**: 문제은행에서 무작위 10문항, 선택지 순서 섞기, 즉시 해설, 80% 이상 통과.
- **문항 유형**: 객관식, 다중 선택, O/X, 매칭(지역↔품종), **지도 클릭형**("바롤로는 어디?"), 이미지 판별(잔 색상/라벨 용어).
- **복습**: 틀린 문제는 Leitner 상자 방식으로 `/review`에 다시 등장. 위키 데이터로 플래시카드 자동 생성("지역 → 주요 품종", "품종 → 대표 산지와 스타일").
- **Anki 내보내기**: 같은 카드 데이터를 `.apkg`로 생성하는 스크립트(`scripts/build-anki.ts`, genanki 계열) 제공 → 반복 학습은 Anki에서도 가능.
- **진도 백업**: JSON 내보내기/가져오기 버튼. v2에서 계정 동기화 옵션.

**문제 데이터 형식**

```yaml
# quizzes/09-climate-and-terroir.yaml
- id: q09-003
  type: single
  ko: { q: "서늘한 기후의 와인에서 일반적으로 더 높게 나타나는 것은?", choices: ["산도", "알코올", "타닌의 부드러움", "잼 같은 과일 향"], explain: "..." }
  en: { q: "...", choices: [...], explain: "..." }
  answer: 0
  refs: [chapter:09#cool-climate, glossary:acidity]
```

## 8. 다국어(i18n) 전략

- **원본 언어는 한국어.** 다른 언어는 `translation.status`로 `machine`(기계 번역 초안) → `reviewed`(사람 검수) 상태를 표시.
- 번역이 없는 페이지는 한국어로 보여주고 상단에 "아직 번역되지 않았습니다" 안내.
- UI 문자열은 `src/i18n/{ko,en,ja,zh}.json`.
- 고유명사 표기 원칙: 원어(프랑스어 등) 병기. 예: 보르도(Bordeaux), 일본어는 カタカナ 관용 표기, 중국어는 대륙 업계 관용 표기(赤霞珠 등).
- 번역 파이프라인: 한국어 확정 → LLM 번역 초안 PR(스크립트) → 원어민/전문가 검수 → `reviewed`. 용어집(`glossary`)을 번역 프롬프트에 강제 적용해 용어 일관성 유지.
- 검색은 Pagefind가 `<html lang>` 기준으로 언어별 인덱스를 분리.
- 중국어는 간체(zh-CN)로 시작. 번체는 수요 시 추가.

## 9. 지도

- `<RegionMap slug="bordeaux" />`: 해당 산지 GeoJSON 폴리곤 + 하위 산지 라벨, 주변 국가 컨텍스트.
- 지역 인덱스 페이지: 세계 지도에서 국가 → 지역 → 세부 산지로 줌인.
- 품종 페이지: "이 품종이 자라는 곳" 점 지도.
- 스타일: 흑백 커스텀 스타일(바다 흰색, 육지 아주 옅은 회색, 경계 회색 헤어라인, 선택 지역만 검정). 라벨은 페이지 언어로.
- 경계 데이터 출처: Natural Earth(퍼블릭 도메인) 국가·주 경계 + OSM(ODbL) 행정구역 + 산지 경계는 공개 데이터가 있는 곳(예: 프랑스 INAO 오픈데이터, 미국 TTB AVA 프로젝트 [UC Davis AVA, CC0]) 우선. 없는 곳은 중심점 + 반경 표시로 시작.
- OSM/ODbL 데이터 사용 시 지도 하단 출처 표기 필수.

## 10. 이미지

- **소스 우선순위**: Wikimedia Commons(CC0/PD/CC BY/CC BY-SA) → Unsplash(Unsplash 라이선스) → 자체 제작 SVG 일러스트(양조 과정·포도 구조·테이스팅 휠 등은 직접 그린다).
- **라이선스 레지스트리** `data/images.yaml`: 파일마다 `source_url, author, license, license_url, title`을 기록. 빌드 시 누락되면 실패.
- `scripts/fetch-commons.ts`: Commons 파일명만 적으면 API로 저자·라이선스를 자동 수집하고 리사이즈(AVIF/WebP)해서 저장.
- 페이지 이미지 캡션에 저자·라이선스 자동 표기, `/credits` 페이지에 전체 목록.
- 와인 라벨/병 사진은 상표·저작권 이슈가 있어 Commons에 있고 라이선스가 명확한 것만 사용.
- 흑백 디자인과의 조화: 사진은 기본 그레이스케일 + 살짝 대비 강화, 호버나 확대 시 컬러(와인 색 비교처럼 색이 정보인 이미지는 항상 컬러).

## 11. 데이터셋 활용과 라이선스 주의사항

| 소스 | 용도 | 라이선스/주의 | 결정 |
|---|---|---|---|
| X-Wines | 산지·품종 매핑, 대표 와인 후보, 와이너리 목록 | 저장소의 라이선스/이용 조건 확인 필요 (연구 목적 공개 데이터셋, 상업 이용·재배포 조건 미확정) | **원본 재배포하지 않음.** 스크립트로 로컬에서 읽어 사실 관계(어느 산지에 어떤 품종)만 추출해 우리가 직접 쓴 문장으로 가공 |
| djtrack16/wine_grapes | 품종 기초 정보(원산지, 동의어) | 라이선스 명시 여부 확인 필요 | 확인 전까지 참고용. 사실 정보만 교차 검증에 사용 |
| SommBench (1,024문항) | 문제은행 | **CC BY-NC 4.0** → 사이트 콘텐츠(CC BY-SA)와 섞으면 라이선스 충돌, 상업 이용 불가 | **기본 번들에 포함하지 않음.** 옵션 A: 커버리지 점검용 참고만 하고 문제는 자체 작성(권장). 옵션 B: `extras/sommbench/`로 분리해 출처·NC 조건 명시한 "연습 모드"로만 제공 |
| USommelier | UX 참고 | 코드 라이선스 확인 필요 | 코드 재사용 안 함, 아이디어만 참고 |
| Brainscape 덱 | 학습 범위 점검 | 사용자 저작물, 재배포 불가 | **복사 금지.** 범위 체크리스트 참고만 |
| WSET 공식 교재/SAT | 커리큘럼 구조 | 저작권·상표 | 구조만 참고, 문장·표 재현 금지. "WSET 공인 아님" 고지 |
| Wikipedia | 사실 확인 | CC BY-SA 4.0 | 문장 차용 시 출처 표기(우리 콘텐츠 라이선스와 호환) |

## 12. 라이선스 (저장소)

- **코드**: MIT (`LICENSE`)
- **콘텐츠(본문, 퀴즈, 자체 일러스트)**: CC BY-SA 4.0 (`LICENSE-CONTENT`)
- **제3자 이미지·데이터**: 각 항목의 원 라이선스 (`data/images.yaml`, `/credits`)

## 13. 디자인 방향

**키워드**: 흑백, 여백, 활자 중심, 정보 밀도는 높게, 장식은 0.

- **색**: `#000`, `#fff`, 회색 4단계(`#111 / #6b6b6b / #d9d9d9 / #f4f4f4`). 강조색 없음. 상태 표시는 채움/테두리/굵기로 구분. 예외는 와인 색 자체를 보여주는 견본뿐.
- **타이포**: 본문 Pretendard(한), Inter(영), Noto Sans JP/SC(일/중). 제목에 세리프 1종(예: Noto Serif KR / Source Serif) 사용해 "책" 같은 인상. 본문 17px/1.7, 한 줄 최대 36em.
- **레이아웃**: 12컬럼 그리드, 8px 간격 체계. 데스크톱은 좌측 목차(컴팩트, 13px) + 본문 + 우측 섹션 진도. 모바일은 하단 고정 진도 바.
- **컴팩트 + spacious 동시 달성법**: 섹션 사이 여백은 넉넉하게(96px), 컴포넌트 내부는 촘촘하게(테이블, 메타데이터 행, 태그는 12–13px, 1px 헤어라인 구분).
- **"AI 슬롭" 피하기 규칙**: 그라디언트·그림자·둥근 카드 남발 금지(모서리 0–2px), 이모지 아이콘 금지, 의미 없는 히어로 일러스트 금지, 반짝이는 배지 금지. 숫자·데이터는 모노스페이스(JetBrains Mono)로.
- **인터랙션**: 체크박스는 사각 테두리 → 검정 채움, 퀴즈 정답은 검정 반전, 오답은 사선 패턴. 애니메이션은 120–180ms 페이드만.
- **다크 모드**: 흑백 반전 그대로 지원.
- **레퍼런스 톤**: 잘 만든 미술관 도록, Swiss typography, 미니멀 문예지.

## 14. 저장소 구조 (예정)

```
winemaster/
  src/
    components/   Quiz, Checkpoint, SectionCheck, RegionMap, GrapeProfile, ImageWithCredit
    layouts/      Base, Chapter, WikiEntry
    pages/[lang]/ learn, wiki, glossary, review, progress
    i18n/         ko.json en.json ja.json zh.json
    lib/          progress.ts (localStorage), leitner.ts, refs.ts
    styles/       tokens.css base.css
  content/        (5장 참조)
  data/           geo/, images.yaml
  public/images/
  scripts/        fetch-commons.ts, build-anki.ts, translate.ts, check-licenses.ts, import-xwines.ts
  docs/           PLAN.md, CONTRIBUTING-content.md, style-guide.md
  .github/workflows/  ci.yml, deploy.yml
```

## 15. 로드맵

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| **M0 셋업** | 저장소, 라이선스, 계획서, Astro 골격, CI, 배포 | 빈 사이트가 GitHub Pages에 뜸 |
| **M1 디자인 시스템** | 토큰, 타이포, 레이아웃, 핵심 컴포넌트 7종 | 스타일 가이드 페이지 |
| **M2 학습 엔진** | 진도 저장, 섹션 체크, 체크포인트, 퀴즈, 복습 | 샘플 챕터 1개로 전체 흐름 동작 |
| **M3 위키 엔진** | 콘텐츠 스키마, 역참조, 검색, 지도 | 지역 5·품종 10 샘플 |
| **M4 Part 1–2 콘텐츠** | 1–13장 + 관련 위키 항목 | 한국어 13챕터 공개 |
| **M5 Part 3–5 콘텐츠** | 14–30장, 지역/품종 확대 | 30챕터 완성 |
| **M6 다국어** | en → ja → zh 번역·검수 | UI 100%, 본문 기계번역+순차 검수 |
| **M7 확장** | Anki 내보내기, 지도 클릭 퀴즈, 진도 동기화(선택) | |

콘텐츠 작성은 "챕터 1개 = PR 1개" 단위로, 각 PR에 해당 챕터의 위키 항목·퀴즈·이미지 레지스트리를 함께 넣는다.

## 16. 로컬 개발 환경 (Windows, `C:\Users\nice0\winemaster`)

```powershell
# 1) 필수 도구 (한 번만)
winget install OpenJS.NodeJS.LTS      # Node 22 LTS
winget install Git.Git
corepack enable                        # pnpm 활성화

# 2) 저장소 연결
cd C:\Users\nice0
# 폴더가 이미 있고 비어 있다면:
cd winemaster
git init
git remote add origin https://github.com/blockdreamers/winemaster.git
git fetch origin
git checkout -b main origin/main
# (폴더가 없다면: git clone https://github.com/blockdreamers/winemaster.git)

# 3) 커밋 계정 (항상 blockdreamers)
git config user.name "blockdreamers"
git config user.email "101175915+blockdreamers@users.noreply.github.com"

# 4) 개발 서버 (M0 골격이 머지된 뒤)
pnpm install
pnpm dev        # http://localhost:4321
```

## 17. 결정이 필요한 사항

1. **지도**: 오픈 지도(MapLibre + OSM 계열, 무료·흑백 가능) **[추천]** vs 구글맵(API 키·결제 필요)
2. **SommBench**: 문제 자체 작성, 참고만 **[추천]** vs NC 조건으로 분리된 연습 모드 제공
3. **배포**: GitHub Pages **[추천, 단순]** vs Cloudflare Pages(PR 미리보기)
4. **중국어**: 간체로 시작 **[추천]** vs 간체+번체 동시
