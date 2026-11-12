import type { AdminAccount } from './admin-account'

/** 지금 로그인한 관리자 자신인지. 내 관리자 ID를 모르면(null) 아니라고 본다 */
export function isSignedInAdmin(admin: AdminAccount, myAdminId: string | null): boolean {
  return admin.id === myAdminId
}

/**
 * 비활성화는 활성인 다른 관리자만 (BE AdminAccount.disable).
 * 자기 자신은 서버가 409, 이미 비활성이면 204로 아무 일 없음이라 버튼을 내지 않는다
 */
export function canDisableAdmin(admin: AdminAccount, myAdminId: string | null): boolean {
  return admin.status === 'ACTIVE' && !isSignedInAdmin(admin, myAdminId)
}
