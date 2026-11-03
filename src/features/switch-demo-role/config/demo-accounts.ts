import type { DemoAccount } from '@/entities/session'

/**
 * 기획서 7.1 시연 데이터의 회원 1 · 2 (로컬 시드와 같은 값).
 * 관리자는 개발용 토큰(회원 토큰)으로 될 수 없어 빠졌다 (BE #755). 관리자 화면에서 관리자 계정으로 따로 로그인한다
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: '보호자', memberId: '1', nickname: '보호자', roles: ['BUYER'] },
  { label: '판매자', memberId: '2', nickname: '테스트상점', roles: ['BUYER', 'SELLER'] },
]
