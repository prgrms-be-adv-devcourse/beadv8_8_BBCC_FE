import { apiClient, expectShape, type Page } from '@/shared/api'
import type { AdminDto } from './admin-account.dto'
import { adminPageShape } from './admin-account.shape'

/** 관리자 계정 목록 (BE AdminAccountController). 추가 · 비활성화는 features/manage-admin-account */
export const adminAccountApi = {
  /** 모든 상태의 관리자, ID 내림차순 (최근에 만든 관리자가 먼저) */
  list: (page: number) =>
    apiClient
      .get<Page<AdminDto>>('/admin/admins', { params: { page, size: 20 } })
      .then(expectShape(adminPageShape)),
}
