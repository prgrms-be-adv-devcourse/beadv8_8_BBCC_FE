import { describe, expect, it } from 'vitest'
import {
  canReapply,
  REJECT_REASON_MAX,
  toSeller,
  validateRejectReason,
  type SellerApplication,
} from '@/entities/seller'

describe('validateRejectReason: 거절 사유 (백엔드 @NotBlank · 200자)', () => {
  it('비었거나 공백뿐이면 안내', () => {
    expect(validateRejectReason('')).toBe('거절 사유를 입력해 주세요.')
    expect(validateRejectReason('   ')).toBe('거절 사유를 입력해 주세요.')
  })
  it('200자까지 통과, 201자부터 안내 (경계)', () => {
    expect(REJECT_REASON_MAX).toBe(200)
    expect(validateRejectReason('가'.repeat(200))).toBeNull()
    expect(validateRejectReason('가'.repeat(201))).toBe('거절 사유는 200자까지예요.')
  })
  it('앞뒤 공백은 길이에서 빼고 본다', () => {
    expect(validateRejectReason(` ${'가'.repeat(200)} `)).toBeNull()
  })
})

const application = (status: SellerApplication['status']): SellerApplication => ({
  id: '1',
  businessName: '테스트상점',
  representativeName: '홍길동',
  maskedBusinessRegistrationNumber: '123-45-*****',
  status,
  createdAt: '2026-10-15T10:00:00',
  rejectReason: status === 'REJECTED' ? '서류 미비' : null,
})

describe('canReapply: 다시 신청할 수 있는지', () => {
  it('신청한 적이 없거나 거절됐으면 신청 가능', () => {
    expect(canReapply(null)).toBe(true)
    expect(canReapply(application('REJECTED'))).toBe(true)
  })
  it('심사 중 · 승인됨이면 신청 불가', () => {
    expect(canReapply(application('PENDING'))).toBe(false)
    expect(canReapply(application('APPROVED'))).toBe(false)
  })
})

describe('toSeller: GET /seller/me → 화면 모델', () => {
  it('판매자 ID(= 회원 ID)를 문자열로 바꾼다', () => {
    expect(toSeller({ sellerId: 2, businessName: '테스트상점', status: 'ACTIVE' })).toEqual({
      id: '2',
      businessName: '테스트상점',
      status: 'ACTIVE',
    })
  })
})
