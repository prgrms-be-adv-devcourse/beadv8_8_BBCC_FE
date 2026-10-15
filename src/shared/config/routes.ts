// 화면 주소는 여기서만 정한다. 화면 · 기능은 문자열 대신 이 값을 쓴다.
import { safeReturnPath } from '../lib/return-path'

/** 화면 영역: 쇼핑(보호자) · 판매자 센터 · 관리자 · 시연 콘솔 */
export type Area = 'shop' | 'center' | 'admin' | 'console'

export const AREA_LABEL: Record<Area, string> = {
  shop: '쇼핑',
  center: '판매자 센터',
  admin: '관리자',
  console: '시연 콘솔',
}

const under = (prefix: string, pathname: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

export function areaOf(pathname: string): Area {
  if (under('/console', pathname)) return 'console'
  if (under('/center', pathname)) return 'center'
  if (under('/admin', pathname)) return 'admin'
  return 'shop'
}

const C = '/console'

export const paths = {
  login: '/login',
  kakaoCallback: '/oauth/kakao/callback',
  shop: {
    home: '/',
    product: (id: string, childId?: string | null) =>
      childId ? `/products/${id}?childId=${childId}` : `/products/${id}`,
    cart: '/cart',
    orders: '/orders',
    order: (id: string) => `/orders/${id}`,
    my: '/my',
    children: '/my/children',
    child: (id: string) => `/my/children/${id}`,
    profile: '/my/profile',
    addresses: '/my/addresses',
    wallet: '/my/wallet',
    chargeSuccess: '/my/wallet/charge/success',
    chargeFail: '/my/wallet/charge/fail',
  },
  center: {
    home: '/center',
    apply: '/center/apply',
    products: '/center/products',
    orders: '/center/orders',
    settlements: '/center/settlements',
  },
  admin: {
    home: '/admin',
    members: '/admin/members',
    sellerApplications: '/admin/seller-applications',
    orders: '/admin/orders',
    products: '/admin/products',
    payments: '/admin/payments',
    settlements: '/admin/settlements',
  },
  console: {
    home: C,
    verify: `${C}/verify`,
    children: `${C}/children`,
    child: (id: string) => `${C}/children/${id}`,
    profile: `${C}/profile`,
    addresses: `${C}/addresses`,
    products: `${C}/products`,
    product: (id: string, childId?: string | null) =>
      childId ? `${C}/products/${id}?childId=${childId}` : `${C}/products/${id}`,
    cart: `${C}/cart`,
    orders: `${C}/orders`,
    order: (id: string) => `${C}/orders/${id}`,
    wallet: `${C}/wallet`,
    chargeSuccess: `${C}/wallet/charge/success`,
    chargeFail: `${C}/wallet/charge/fail`,
    sellerApply: `${C}/seller/apply`,
    sellerProducts: `${C}/seller/products`,
    sellerOrders: `${C}/seller/orders`,
    sellerSettlements: `${C}/seller/settlements`,
    adminSellerApplications: `${C}/admin/seller-applications`,
    adminSettlements: `${C}/admin/settlements`,
    adminMembers: `${C}/admin/members`,
    adminOrders: `${C}/admin/orders`,
    adminProducts: `${C}/admin/products`,
    adminPayments: `${C}/admin/payments`,
  },
} as const

/** 영역마다 따로 있는 예치금 · 충전 결과 화면 (충전은 쇼핑 · 콘솔에서만) */
export function walletPathsOf(area: Area) {
  const base = area === 'console' ? paths.console : paths.shop
  return { wallet: base.wallet, chargeSuccess: base.chargeSuccess, chargeFail: base.chargeFail }
}

/** 영역마다 있는 회원 · 자녀 화면 (판매자 센터 · 관리자에서는 쇼핑 화면으로) */
export function memberPathsOf(area: Area) {
  const base = area === 'console' ? paths.console : paths.shop
  return {
    children: base.children,
    child: base.child,
    addresses: base.addresses,
    profile: base.profile,
  }
}

/** 로그인해야 볼 수 있는 쇼핑 화면: 장바구니 · 주문 · 마이페이지(자녀 · 배송지 · 예치금 포함). 홈 · 상품은 누구나 */
export function shopNeedsLogin(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return [paths.shop.cart, paths.shop.orders, paths.shop.my].some((prefix) => under(prefix, path))
}

/** 로그인 화면 주소. next = 로그인 뒤 돌아올 화면 (앱 안 주소만) */
export function loginPath(next: string | null): string {
  const target = safeReturnPath(next)
  return target ? `${paths.login}?next=${encodeURIComponent(target)}` : paths.login
}
