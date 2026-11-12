import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { withdrawErrorMessage } from '@/features/edit-profile'

// 계약: BE MemberController.withdraw · MemberErrorCode (응답에 오류 코드가 없어 status로만 나눈다)

function problem(status: number, title: string | null, detail: string | null = null) {
  const config = { headers: new AxiosHeaders() }
  const data = title === null ? null : { type: 'about:blank', title, status, detail, instance: '/' }
  const response = { status, statusText: '', headers: {}, config, data }
  return new AxiosError('error', AxiosError.ERR_BAD_REQUEST, config, null, response)
}

describe('withdrawErrorMessage: 탈퇴 실패 안내', () => {
  it('판매자 탈퇴 차단(409 SELLER_WITHDRAWAL_BLOCKED)은 남은 항목을 적은 서버 detail 그대로', () => {
    const error = problem(
      409,
      '탈퇴할 수 없는 판매자입니다',
      '구매확정 전 주문상품 2건, 지급되지 않은 정산 1건이 남아 있어 탈퇴할 수 없어요.',
    )
    expect(withdrawErrorMessage(error)).toBe(
      '구매확정 전 주문상품 2건, 지급되지 않은 정산 1건이 남아 있어 탈퇴할 수 없어요.',
    )
  })

  it('이미 정지 · 탈퇴한 회원(409 MEMBER_NOT_WITHDRAWABLE)은 서버 detail 그대로', () => {
    const error = problem(409, '탈퇴할 수 없는 회원입니다', '이미 정지 · 탈퇴한 회원입니다.')
    expect(withdrawErrorMessage(error)).toBe('이미 정지 · 탈퇴한 회원입니다.')
  })

  it('탈퇴 조건 확인 실패(503 SELLER_WITHDRAWAL_CHECK_UNAVAILABLE)는 탈퇴되지 않았으니 다시 시도하라고 한다', () => {
    const error = problem(503, '탈퇴 조건을 확인하지 못했어요', '잠시 뒤 다시 시도해 주세요.')
    expect(withdrawErrorMessage(error)).toBe('탈퇴하지 못했어요. 잠시 뒤 다시 시도해 주세요.')
  })

  it('ProblemDetail이 없는 503(배포 중 등)도 탈퇴되지 않았으니 다시 시도하라고 한다', () => {
    expect(withdrawErrorMessage(problem(503, null))).toBe(
      '탈퇴하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
    )
  })
})
