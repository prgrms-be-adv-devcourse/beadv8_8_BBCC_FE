import { describe, expect, it } from 'vitest'
import { validate } from '@/shared/api'
import type { SellerApplicationSummaryDto } from '@/entities/seller/api/seller.dto'
import { sellerApplicationPageShape } from '@/entities/seller/api/seller.shape'
import { toSellerApplicationSummary } from '@/entities/seller/model/seller.mapper'

// 백엔드 SellerApplication.clearPersonalInfo: 신청한 회원이 탈퇴하면 닉네임 · 사업자등록번호를 비운다
const withdrawn: SellerApplicationSummaryDto = {
  id: 7,
  businessName: '탈퇴상점',
  applicantId: 12,
  applicantNickname: null,
  maskedBusinessRegistrationNumber: null,
  status: 'PENDING',
  createdAt: '2026-10-15T10:00:00',
}

describe('탈퇴한 회원의 판매자 신청 (관리자 목록 · 승인 · 거절 응답)', () => {
  it('닉네임 · 사업자등록번호가 null이어도 계약 불일치가 아니다', () => {
    const page = {
      content: [withdrawn],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    }
    expect(validate(page, sellerApplicationPageShape)).toEqual([])
  })

  it('닉네임은 「탈퇴한 회원」, 사업자번호는 「탈퇴로 삭제됨」으로 보인다', () => {
    expect(toSellerApplicationSummary(withdrawn)).toMatchObject({
      applicantId: '12',
      applicantNickname: '탈퇴한 회원',
      maskedBusinessRegistrationNumber: '탈퇴로 삭제됨',
    })
  })

  it('값이 있으면 그대로 보인다', () => {
    expect(
      toSellerApplicationSummary({
        ...withdrawn,
        applicantNickname: '판매희망',
        maskedBusinessRegistrationNumber: '214-8*-*****',
      }),
    ).toMatchObject({
      applicantNickname: '판매희망',
      maskedBusinessRegistrationNumber: '214-8*-*****',
    })
  })
})
