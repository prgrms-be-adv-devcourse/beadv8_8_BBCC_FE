import path from 'node:path'
import { defineConfig } from 'vitest/config'

// 단위 테스트: 매퍼 · 업무 규칙 · 계약 검사 · 상태 변화 · 흐름 판정 (화면 없이 순수 함수만)
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // 브라우저 전용 기본값(window.location)을 읽지 않도록 테스트용 값을 준다
    env: { VITE_KAKAO_REDIRECT_URI: 'http://localhost/oauth/kakao/callback' },
  },
})
