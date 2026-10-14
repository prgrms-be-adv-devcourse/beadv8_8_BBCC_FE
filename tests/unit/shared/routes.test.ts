import { describe, expect, it } from 'vitest'
import { areaOf, paths } from '@/shared/config'

describe('areaOf: 주소로 화면 영역을 나눈다', () => {
  it.each([
    ['/', 'shop'],
    ['/products/1', 'shop'],
    ['/cart', 'shop'],
    ['/my/wallet', 'shop'],
    ['/login', 'shop'],
    ['/center', 'center'],
    ['/center/orders', 'center'],
    ['/admin', 'admin'],
    ['/admin/settlements', 'admin'],
    ['/console', 'console'],
    ['/console/seller/products', 'console'],
  ] as const)('%s → %s', (pathname, area) => {
    expect(areaOf(pathname)).toBe(area)
  })

  it('접두어만 같은 주소는 다른 영역으로 보지 않는다 (경계)', () => {
    expect(areaOf('/consoles')).toBe('shop')
    expect(areaOf('/centerfold')).toBe('shop')
    expect(areaOf('/administrator')).toBe('shop')
  })
})

describe('paths: 영역별 주소', () => {
  it('콘솔 주소는 모두 /console 아래에 있다', () => {
    expect(paths.console.home).toBe('/console')
    expect(paths.console.order('9')).toBe('/console/orders/9')
    expect(paths.console.product('3')).toBe('/console/products/3')
    expect(areaOf(paths.console.verify)).toBe('console')
  })

  it('충전 결과 주소는 시작한 영역의 예치금 화면 아래에 있다', () => {
    expect(paths.shop.chargeSuccess).toBe('/my/wallet/charge/success')
    expect(paths.console.chargeSuccess).toBe('/console/wallet/charge/success')
    expect(areaOf(paths.shop.chargeFail)).toBe('shop')
    expect(areaOf(paths.console.chargeFail)).toBe('console')
  })

  it('쇼핑 상품 주소는 자녀를 고르면 childId를 붙인다', () => {
    expect(paths.shop.product('1')).toBe('/products/1')
    expect(paths.shop.product('1', '5')).toBe('/products/1?childId=5')
  })
})
