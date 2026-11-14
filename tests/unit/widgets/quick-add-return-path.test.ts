import { describe, expect, it } from 'vitest'
import { quickAddReturnPath } from '@/widgets/quick-add'

describe('quickAddReturnPath: 담기 팝업에서 로그인하러 갈 때 돌아올 상품 상세 주소', () => {
  it.each([
    ['/products/1', null, 1, '/products/1'],
    ['/products/1', '12', 1, '/products/1?option=12'],
    ['/products/1', '12', 3, '/products/1?option=12&qty=3'],
    ['/products/1?childId=2', '12', 3, '/products/1?childId=2&option=12&qty=3'],
    ['/products/1?childId=2', null, 3, '/products/1?childId=2'],
  ])('상세 %s · 옵션 %s · 수량 %i이면 %s', (detailHref, optionId, quantity, expected) => {
    expect(quickAddReturnPath(detailHref, optionId, quantity)).toBe(expected)
  })
})
