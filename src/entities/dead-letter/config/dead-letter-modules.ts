/**
 * 회원 서비스에서 처리 실패 메시지(DLT)를 따로 보관하는 모듈. 모듈마다 관리자 API 경로만 다르고 응답 칸은 같다 (BE #962)
 */
export const DEAD_LETTER_MODULES = {
  auth: { label: '인증', path: '/admin/auth-dead-letters' },
  member: { label: '회원', path: '/admin/member-dead-letters' },
  seller: { label: '판매자', path: '/admin/seller-dead-letters' },
  'child-profile': { label: '자녀 프로필', path: '/admin/child-profile-dead-letters' },
} as const

export type DeadLetterModule = keyof typeof DEAD_LETTER_MODULES
