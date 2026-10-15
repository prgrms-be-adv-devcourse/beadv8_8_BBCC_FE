import { describe, expect, it } from 'vitest'
import { areaOf, loginPath, memberPathsOf, paths, shopNeedsLogin } from '@/shared/config'

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

describe('회원 · 자녀 보완 화면 주소', () => {
  it('자녀 상세 · 내 정보는 쇼핑과 콘솔에 각각 있다', () => {
    expect(memberPathsOf('shop').child('3')).toBe('/my/children/3')
    expect(memberPathsOf('console').child('3')).toBe('/console/children/3')
    expect(memberPathsOf('shop').profile).toBe('/my/profile')
    expect(memberPathsOf('console').profile).toBe('/console/profile')
  })
  it('판매자 센터 · 관리자에서는 쇼핑 주소를 쓴다', () => {
    expect(memberPathsOf('center').children).toBe('/my/children')
    expect(memberPathsOf('admin').child('1')).toBe('/my/children/1')
  })
})

describe('관리자 보완 화면 주소', () => {
  it('관리자 영역과 콘솔에 회원 · 주문 · 결제 조회가 있다', () => {
    expect([paths.admin.members, paths.admin.orders, paths.admin.payments]).toEqual([
      '/admin/members',
      '/admin/orders',
      '/admin/payments',
    ])
    expect([
      paths.console.adminMembers,
      paths.console.adminOrders,
      paths.console.adminPayments,
    ]).toEqual(['/console/admin/members', '/console/admin/orders', '/console/admin/payments'])
    expect(areaOf(paths.admin.members)).toBe('admin')
  })
})

describe('상품 보완 화면 주소', () => {
  it('관리자 상품 관리는 관리자 영역과 콘솔에 있다', () => {
    expect(paths.admin.products).toBe('/admin/products')
    expect(paths.console.adminProducts).toBe('/console/admin/products')
  })
})

describe('shopNeedsLogin: 로그인해야 볼 수 있는 쇼핑 화면', () => {
  it.each([
    [paths.shop.cart, true],
    [paths.shop.orders, true],
    [paths.shop.order('3'), true],
    [paths.shop.my, true],
    [paths.shop.wallet, true],
    [paths.shop.chargeSuccess, true],
    [paths.shop.child('1'), true],
    [paths.shop.home, false],
    [paths.shop.product('1'), false],
    [paths.login, false],
    [paths.kakaoCallback, false],
    ['/없는-주소', false],
  ] as const)('%s → %s', (pathname, expected) => {
    expect(shopNeedsLogin(pathname)).toBe(expected)
  })

  it('끝의 /도 같은 화면으로 본다', () => {
    expect(shopNeedsLogin('/cart/')).toBe(true)
    expect(shopNeedsLogin('/my/')).toBe(true)
  })
})

describe('loginPath: 로그인 뒤 돌아올 주소를 담는다', () => {
  it('next에 주소 · 검색값을 그대로 담는다', () => {
    expect(loginPath('/products/1?childId=2')).toBe('/login?next=%2Fproducts%2F1%3FchildId%3D2')
  })

  it('돌아올 곳이 없거나 앱 밖 주소면 로그인 화면만', () => {
    expect(loginPath(null)).toBe('/login')
    expect(loginPath('https://evil.example')).toBe('/login')
  })
})
