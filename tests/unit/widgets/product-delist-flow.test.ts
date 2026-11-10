import { describe, expect, it } from 'vitest'
import type { ApiCallLog } from '@/shared/api'
import { domainOf, flowOf } from '@/widgets/api-flow-panel/config/domain-flow'
import { deriveStateChanges } from '@/widgets/api-flow-panel/model/state-changes'

// 등록 취소(판매자 PUT) · 되돌리기(관리자 DELETE)도 상품 상태를 바꾸고 product.changed를 보낸다

let id = 0
const log = (patch: Partial<ApiCallLog>): ApiCallLog => ({
  id: ++id,
  action: null,
  actor: '2',
  method: 'GET',
  path: '/',
  status: 200,
  durationMs: 10,
  startedAt: `2026-11-10T10:00:0${id % 10}.000Z`,
  mock: false,
  requestBody: null,
  responseBody: null,
  contractIssues: [],
  ...patch,
})
const saleStatus = (status: string) => ({ productId: '7', status, version: 3 })

describe('등록 취소 · 되돌리기 흐름', () => {
  it.each([
    ['PUT', '/seller/products/7/delisting'],
    ['DELETE', '/admin/products/7/delisting'],
  ])('%s %s는 상품 도메인이고 product.changed를 보낸다', (method, path) => {
    expect(domainOf(path)).toBe('product')
    expect(flowOf(method, path).map((step) => [step.name, step.to])).toEqual([
      ['product.changed', ['recommend', 'order']],
    ])
  })

  it('판매 중 → 등록 취소 → (관리자) 판매 중지로 바뀐 순간을 상태 변화로 뽑는다', () => {
    const changes = deriveStateChanges([
      log({
        method: 'PUT',
        path: '/seller/products/7/sale-status',
        responseBody: saleStatus('ON_SALE'),
      }),
      log({
        method: 'PUT',
        path: '/seller/products/7/delisting',
        responseBody: saleStatus('DELISTED'),
      }),
      log({
        actor: '3',
        method: 'DELETE',
        path: '/admin/products/7/delisting',
        responseBody: saleStatus('STOPPED'),
      }),
    ])
    expect(
      changes.filter((change) => change.from !== null).map((c) => [c.resource, c.from, c.to]),
    ).toEqual([
      ['상품 #7', 'ON_SALE', 'DELISTED'],
      ['상품 #7', 'DELISTED', 'STOPPED'],
    ])
  })
})
