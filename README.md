# WineMaster

와인을 체계적으로 공부하는 오픈소스 커리큘럼이자, 지역·품종·스타일·와이너리를 검색할 수 있는 와인 지식 위키입니다.

An open-source wine curriculum and searchable wine wiki. Korean first, with English, Japanese and Chinese editions.

## 무엇을 하나요

- **Learn**: WSET L1→L3 흐름을 뼈대로 한 30개 챕터. 읽고, 이해한 섹션을 체크하고, 확인 질문과 챕터 퀴즈를 통과하며 진도를 쌓습니다.
- **Wiki**: 지역(지도 포함), 품종, 와인 스타일, 대표 와인, 와이너리, 역사, 용어집을 서로 연결한 지식 베이스.
- **Review**: 틀린 문제 복습, 플래시카드, Anki 내보내기.
- **4 languages**: 한국어(원본) · English · 日本語 · 简体中文

로그인 없이 브라우저에 진도가 저장됩니다.

## 상태

1차 골격이 동작합니다. 커리큘럼 30장 목차, 1장 본문(한국어·영어), 섹션 체크·확인 질문·챕터 퀴즈, 진도 저장, 위키 샘플(지역 4·품종 4), 지도, 검색이 들어 있습니다. 전체 계획은 [docs/PLAN.md](docs/PLAN.md)를 보세요.

## 로컬 실행

```bash
corepack enable          # pnpm
pnpm install
pnpm dev                 # http://localhost:4321
pnpm build && pnpm preview   # 검색 색인(Pagefind)까지 포함한 운영 빌드 확인
```

## 콘텐츠 쓰는 법

- 챕터: `content/chapters/<lang>/<번호-슬러그>.mdx`. 본문은 `<Section id title>`으로 나누고, 섹션 사이에 `<Checkpoint>`를 넣고, 퀴즈는 frontmatter의 `quiz`에 씁니다.
- 지역: `content/regions/<lang>/<slug>.mdx`, 품종: `content/grapes/<lang>/<slug>.mdx`. 서로 slug로 참조하면 링크와 지도가 자동으로 붙습니다.
- 번역이 없는 언어는 한국어 원문을 안내 문구와 함께 보여 줍니다.

## 기술 스택

Astro · MDX · Preact · Pagefind · MapLibre GL + OpenStreetMap · GitHub Pages

## 라이선스

- 코드: [MIT](LICENSE)
- 콘텐츠(본문, 퀴즈, 자체 제작 일러스트): [CC BY-SA 4.0](LICENSE-CONTENT)
- 제3자 이미지와 데이터: 각 항목에 표기된 원 라이선스

WineMaster는 WSET 또는 기타 인증 기관과 관련이 없으며, 공식 교재의 내용을 복제하지 않습니다.
