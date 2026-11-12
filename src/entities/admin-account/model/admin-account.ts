/** BE AdminStatus. 비활성 관리자는 로그인 · 재발급이 막힌다 */
export type AdminStatus = 'ACTIVE' | 'DISABLED'

/** 관리자 계정 (화면용) */
export type AdminAccount = {
  id: string
  email: string
  status: AdminStatus
  createdAt: string
}

export const ADMIN_STATUS_LABEL: Record<AdminStatus, string> = {
  ACTIVE: '활성',
  DISABLED: '비활성',
}
