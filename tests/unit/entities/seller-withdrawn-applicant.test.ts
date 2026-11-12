import { describe, expect, it } from 'vitest'
import { validate } from '@/shared/api'
import {
  approveBlockReason,
  canApprove,
  isDecided,
  type SellerApplicationSummary,
} from '@/entities/seller'
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
      isApplicantWithdrawn: true,
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
      isApplicantWithdrawn: false,
    })
  })
})

// 백엔드 SellerApplication.approve: 탈퇴한 회원이면 409 APPLICANT_WITHDRAWN. 거절은 막지 않는다
const summary = (
  status: SellerApplicationSummary['status'],
  isApplicantWithdrawn: boolean,
): SellerApplicationSummary => ({
  id: '7',
  businessName: '탈퇴상점',
  applicantId: '12',
  applicantNickname: isApplicantWithdrawn ? '탈퇴한 회원' : '판매희망',
  maskedBusinessRegistrationNumber: isApplicantWithdrawn ? '탈퇴로 삭제됨' : '214-8*-*****',
  status,
  createdAt: '2026-10-15T10:00:00',
  isApplicantWithdrawn,
})

describe('canApprove: 승인할 수 있는지', () => {
  it('심사 중이고 탈퇴하지 않은 회원의 신청만 승인할 수 있다', () => {
    expect(canApprove(summary('PENDING', false))).toBe(true)
  })
  it('탈퇴한 회원의 신청은 심사 중이어도 승인할 수 없다', () => {
    expect(canApprove(summary('PENDING', true))).toBe(false)
  })
  it('이미 처리한 신청은 승인할 수 없다', () => {
    expect(canApprove(summary('APPROVED', false))).toBe(false)
    expect(canApprove(summary('REJECTED', false))).toBe(false)
  })
})

describe('approveBlockReason: 승인을 막는 이유', () => {
  it('탈퇴한 회원이면 이유를 보인다', () => {
    expect(approveBlockReason(summary('PENDING', true))).toBe('탈퇴한 회원이라 승인할 수 없어요')
  })
  it('탈퇴하지 않았으면 null', () => {
    expect(approveBlockReason(summary('PENDING', false))).toBeNull()
  })
})

describe('isDecided: 처리한 신청 표에 들어가는지', () => {
  it('승인 · 거절된 신청만 (탈퇴한 회원의 심사 중 신청은 심사 대기에 남는다)', () => {
    expect(isDecided(summary('APPROVED', false))).toBe(true)
    expect(isDecided(summary('REJECTED', true))).toBe(true)
    expect(isDecided(summary('PENDING', false))).toBe(false)
    expect(isDecided(summary('PENDING', true))).toBe(false)
  })
})
