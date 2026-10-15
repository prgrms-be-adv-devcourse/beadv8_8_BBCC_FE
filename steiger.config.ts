import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// FSD 구조 검사 (Spring의 ArchUnit 역할): 레이어 방향 · 같은 레이어 import · 공개 API 우회 등.
// 구조와 무관한 스타일 제안만 끈다
export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // 사용자 행동 하나 = feature 하나로 일부러 나눈다 (한 페이지에서만 써도 합치지 않음)
      'fsd/insignificant-slice': 'off',
      // 슬라이스 개수 제안
      'fsd/excessive-slicing': 'off',
      // 세그먼트 이름 제안 (app/providers)
      'fsd/segments-by-purpose': 'off',
    },
  },
])
