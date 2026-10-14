import type { DevTokenRequest } from '@/entities/session'

/** 기획서 7.1 시연 데이터의 회원 1 · 2 · 3 (scripts/demo-seed.sql과 같은 값) */
export const DEMO_ACCOUNTS: { label: string; request: DevTokenRequest }[] = [
  { label: '보호자', request: { memberId: 1, nickname: '보호자', roles: ['BUYER'] } },
  { label: '판매자', request: { memberId: 2, nickname: '테스트상점', roles: ['BUYER', 'SELLER'] } },
  { label: '관리자', request: { memberId: 3, nickname: '관리자', roles: ['ADMIN'] } },
]
