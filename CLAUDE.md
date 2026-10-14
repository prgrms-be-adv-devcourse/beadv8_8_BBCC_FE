# Kidly FE

@AGENTS.md

규칙은 모두 `AGENTS.md`에 있다. 이 파일에는 규칙을 적지 않고, 명령어만 둔다.

## 명령어

| 목적                 | 명령                                                              |
| -------------------- | ----------------------------------------------------------------- |
| 한 번에 검사         | `npm run check` (lint · format · build · test)                    |
| 실행                 | `npm run dev` (`.env.example`을 `.env.local`로 복사)              |
| 린트 · 포맷          | `npm run lint` / `npm run format:check` (고치기 `npm run format`) |
| 빌드(타입 검사 포함) | `npm run build`                                                   |
| 단위 테스트          | `npm run test` (작성 중엔 `npm run test:watch`)                   |
| E2E                  | `npm run test:e2e` (처음 한 번 `npx playwright install chromium`) |
| 컴포넌트 추가        | `npx shadcn@latest add <name>` → `src/shared/ui`                  |
