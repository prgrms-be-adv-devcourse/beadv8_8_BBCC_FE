import { describe, expect, it } from 'vitest'
import { hasRole } from '@/entities/session'
import {
  canCancelCharge,
  isAwaitingPayment,
  shortageOf,
  toConfirmChargeRequest,
  toFailChargeRequest,
  validateChargeAmount,
  type Charge,
} from '@/entities/wallet'

const charge = (overrides: Partial<Charge>): Charge => ({
  id: '1',
  tossOrderId: 'toss-1',
  amount: 1000,
  status: 'DONE',
  approvedAt: null,
  expiresAt: '2026-10-18T10:30:00',
  createdAt: '2026-10-18T10:00:00',
  ...overrides,
})

describe('충전 금액 (1천 원 ~ 100만 원)', () => {
  it('경계값', () => {
    expect(validateChargeAmount(999)).not.toBeNull()
    expect(validateChargeAmount(1_000)).toBeNull()
    expect(validateChargeAmount(1_000_000)).toBeNull()
    expect(validateChargeAmount(1_000_001)).not.toBeNull()
  })
  it('원 단위 정수만', () => {
    expect(validateChargeAmount(1500.5)).not.toBeNull()
  })
})

describe('토스 복귀 값 → 승인 요청', () => {
  it('paymentKey · orderId · amount가 모두 있어야 한다', () => {
    expect(
      toConfirmChargeRequest(new URLSearchParams('paymentKey=pk&orderId=o1&amount=50000')),
    ).toEqual({
      paymentKey: 'pk',
      orderId: 'o1',
      amount: 50000,
    })
    expect(toConfirmChargeRequest(new URLSearchParams('orderId=o1&amount=50000'))).toBeNull()
    expect(
      toConfirmChargeRequest(new URLSearchParams('paymentKey=pk&orderId=o1&amount=0')),
    ).toBeNull()
  })
})

describe('토스 실패 복귀 값 → 실패 처리 요청', () => {
  it('orderId · code가 모두 있어야 한다', () => {
    expect(
      toFailChargeRequest(new URLSearchParams('code=PAY_PROCESS_CANCELED&message=m&orderId=o1')),
    ).toEqual({ orderId: 'o1', code: 'PAY_PROCESS_CANCELED' })
    expect(toFailChargeRequest(new URLSearchParams('code=PAY_PROCESS_CANCELED'))).toBeNull()
    expect(toFailChargeRequest(new URLSearchParams('orderId=o1'))).toBeNull()
  })
})

describe('결제가 끝나지 않은 충전', () => {
  const now = new Date('2026-10-18T10:10:00')
  it('결제 대기이면서 만료 전이면 안내한다', () => {
    expect(isAwaitingPayment(charge({ status: 'PENDING' }), now)).toBe(true)
  })
  it('만료 시각이 지났거나 같으면 안내하지 않는다 (경계)', () => {
    expect(
      isAwaitingPayment(charge({ status: 'PENDING', expiresAt: '2026-10-18T10:10:00' }), now),
    ).toBe(false)
    expect(
      isAwaitingPayment(charge({ status: 'PENDING', expiresAt: '2026-10-18T10:10:01' }), now),
    ).toBe(true)
  })
  it('결제 대기가 아니면 안내하지 않는다', () => {
    expect(isAwaitingPayment(charge({ status: 'FAILED' }), now)).toBe(false)
    expect(isAwaitingPayment(charge({ status: 'DONE' }), now)).toBe(false)
  })
})

describe('예치금 규칙', () => {
  it('충전 완료된 건만 취소할 수 있다', () => {
    expect(canCancelCharge(charge({ status: 'DONE' }))).toBe(true)
    expect(canCancelCharge(charge({ status: 'CANCELLED' }))).toBe(false)
  })
  it('잔액이 주문 금액보다 모자란 만큼 (같으면 0, 경계)', () => {
    expect(shortageOf(100_000, 125_000)).toBe(25_000)
    expect(shortageOf(25_000, 25_000)).toBe(0)
    expect(shortageOf(undefined, 25_000)).toBe(0)
  })
})

describe('세션 역할', () => {
  it('메뉴 노출용 역할 확인', () => {
    const user = { memberId: '2', nickname: '테스트상점', roles: ['BUYER', 'SELLER'] as const }
    expect(hasRole({ ...user, roles: [...user.roles] }, 'SELLER')).toBe(true)
    expect(hasRole({ ...user, roles: [...user.roles] }, 'ADMIN')).toBe(false)
    expect(hasRole(null, 'BUYER')).toBe(false)
  })
})

describe('토큰 → 로그인 사용자', () => {
  it('JWT payload의 sub · 한글 닉네임 · roles를 읽는다', async () => {
    const { toSessionUser } = await import('@/entities/session/model/session.mapper')
    const payload = Buffer.from(
      JSON.stringify({ sub: '2', nickname: '테스트상점', roles: ['BUYER', 'SELLER'] }),
    ).toString('base64url')
    expect(toSessionUser(`header.${payload}.sig`)).toEqual({
      memberId: '2',
      nickname: '테스트상점',
      roles: ['BUYER', 'SELLER'],
    })
  })
  it('닉네임이 없으면 회원+ID', async () => {
    const { toSessionUser } = await import('@/entities/session/model/session.mapper')
    const payload = Buffer.from(JSON.stringify({ sub: '7' })).toString('base64url')
    expect(toSessionUser(`h.${payload}.s`)).toEqual({ memberId: '7', nickname: '회원7', roles: [] })
  })
})
