import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  canTrackDelivery,
  childNameOf,
  toDeliveryTracking,
  trackingErrorOf,
  trackingStatusLabel,
  type OrderDelivery,
} from '@/entities/order'

const delivery: OrderDelivery = {
  id: '5',
  sellerId: '2',
  sellerName: '키들리상점',
  status: 'SHIPPING',
  carrier: 'HANJIN',
  trackingNumber: '123456789012',
  shippedAt: '2026-11-12T10:00:00',
  deliveredAt: null,
}

describe('toDeliveryTracking: 택배 진행 이력 (BE #1320, 최신이 먼저)', () => {
  it('순서는 그대로, 시각은 한국 시간 「yyyy-mm-dd hh:mm」, 빈 장소는 null', () => {
    const tracking = toDeliveryTracking({
      carrier: 'HANJIN',
      trackingNumber: '123456789012',
      events: [
        { time: '2026-11-12T09:30:00+09:00', location: '  ', status: 'OUT_FOR_DELIVERY' },
        { time: '2026-11-11T15:00:00Z', location: '대전 HUB', status: 'IN_TRANSIT' },
        { time: '2026-11-11T08:05:00', location: null, status: 'AT_PICKUP' },
      ],
    })
    expect(tracking).toEqual({
      carrier: 'HANJIN',
      trackingNumber: '123456789012',
      events: [
        { time: '2026-11-12 09:30', location: null, status: 'OUT_FOR_DELIVERY' },
        { time: '2026-11-12 00:00', location: '대전 HUB', status: 'IN_TRANSIT' },
        { time: '2026-11-11 08:05', location: null, status: 'AT_PICKUP' },
      ],
    })
  })

  it('상태 코드는 한국어로, 모르는 값은 그대로', () => {
    expect(trackingStatusLabel('IN_TRANSIT')).toBe('이동 중')
    expect(trackingStatusLabel('OUT_FOR_DELIVERY')).toBe('배송 출발')
    expect(trackingStatusLabel('DELIVERED')).toBe('배송 완료')
    expect(trackingStatusLabel('NEW_CODE')).toBe('NEW_CODE')
  })
})

describe('canTrackDelivery: 운송장이 있는 발송 이후 배송만 조회한다 (발송 전은 BE 409)', () => {
  it.each([
    [{ status: 'SHIPPING' }, true],
    [{ status: 'DELIVERED' }, true],
    [{ status: 'READY', trackingNumber: null }, false],
    [{ status: 'SHIPPING', trackingNumber: null }, false],
    [{ status: 'CANCELLED', trackingNumber: null }, false],
  ] as const)('%o → %s', (patch, expected) => {
    expect(canTrackDelivery({ ...delivery, ...patch })).toBe(expected)
  })
})

function problem(status: number, detail: string | null) {
  const config = { headers: new AxiosHeaders() }
  const data =
    detail === null ? null : { type: 'about:blank', title: 't', status, detail, instance: '/' }
  return new AxiosError('error', 'ERR', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  })
}

describe('trackingErrorOf: 404 · 409는 서버 문구, 503은 정한 문구와 다시 시도', () => {
  it('404 · 409', () => {
    expect(trackingErrorOf(problem(409, '아직 발송 전이에요.'))).toEqual({
      message: '아직 발송 전이에요.',
      canRetry: false,
    })
    expect(trackingErrorOf(problem(404, '배송을 찾을 수 없어요.')).canRetry).toBe(false)
  })

  it('503은 서버 문구와 상관없이 정한 문구 + 다시 시도', () => {
    const expected = {
      message: '지금 택배 조회를 할 수 없어요. 잠시 후 다시 시도해 주세요',
      canRetry: true,
    }
    expect(trackingErrorOf(problem(503, '서킷이 열려 있습니다'))).toEqual(expected)
    expect(trackingErrorOf(problem(503, null))).toEqual(expected)
  })
})

describe('childNameOf: 입을 아이 이름 (주문에 없으면 내 자녀 목록, 거기도 없으면 번호)', () => {
  const names = { '13': '김들희' }
  it.each([
    [{ id: '13', name: '지우' }, '지우'],
    [{ id: '13', name: null }, '김들희'],
    [{ id: '99', name: null }, '#99'],
  ])('%o → %s', (child, expected) => {
    expect(childNameOf(child, names)).toBe(expected)
  })
})
