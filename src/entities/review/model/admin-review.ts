export type ModerationStatus = 'HIDDEN' | 'CONFIRMED_HIDDEN' | 'RESTORED' | 'PENDING' | 'PASSED'
export type ModerationReason =
  'PROFANITY' | 'HATE' | 'SEXUAL' | 'VIOLENCE' | 'ILLEGAL' | 'PRIVACY' | 'OTHER'
/** 관리자 조치: HIDDEN = 숨김 확정, VISIBLE = 다시 공개 */
export type ModerationAction = 'HIDDEN' | 'VISIBLE'

export type AdminReview = {
  id: string
  productId: string
  status: ModerationStatus
  reason: ModerationReason | null
  moderatedAt: string | null
  attempts: number
  /** 판단하지 못한 검사가 상한에 닿아 공개 그대로 관리자 판단을 기다리는지 */
  isAttemptsExhausted: boolean
  content: string
  imageUrls: string[]
  createdAt: string
}
