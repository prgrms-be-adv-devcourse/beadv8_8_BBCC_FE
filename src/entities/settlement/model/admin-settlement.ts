import type { Settlement } from './settlement'

/** 관리자 정산서 목록 한 줄 */
export type AdminSettlement = Settlement & {
  sellerId: string
  failReason: string | null
}
