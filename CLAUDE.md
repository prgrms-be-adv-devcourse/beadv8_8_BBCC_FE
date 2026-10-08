# Kidly FE

자녀 맞춤 키즈 패션 이커머스 프론트. React 19 / Vite / TypeScript / Tailwind CSS v4 / shadcn/ui / React Query / Zustand / React Router.

## 명령어

- 실행: `npm run dev` (`.env.example`을 `.env.local`로 복사)
- 린트: `npm run lint` (ESLint) / 포맷: `npm run format`
- 빌드: `npm run build`
- 컴포넌트 추가: `npx shadcn@latest add <name>` → `src/shared/ui`에 생성

## 구조

- `src/app`: 라우터, Provider, 레이아웃
- `src/pages`: 라우트 단위 페이지
- `src/features/<도메인>`: member, product, recommend, order, payment, settlement. 안에 `api/`, `components/`, `types.ts`
- `src/shared`: `api`(axios 인스턴스), `ui`(shadcn), `lib`, `store`(Zustand)
- import는 `@/` 별칭을 쓴다

## 규칙

- 서버 데이터는 React Query, 클라이언트 전역 상태(인증 토큰 등)만 Zustand
- camelCase: 변수·함수 / PascalCase: 컴포넌트·타입
- `package.json`, `package-lock.json`은 관리자만 수정한다
- 브랜치 `feature/도메인/#이슈-기능`, 커밋 `타입: 요약`. main·develop 직접 push 금지
