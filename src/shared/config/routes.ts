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
const RECOMMENDED = '/recommended'

export const paths = {
  login: '/login',
  kakaoCallback: '/oauth/kakao/callback',
  shop: {
    home: '/',
    product: (id: string, childId?: string | null) =>
      childId ? `/products/${id}?childId=${childId}` : `/products/${id}`,
    /** 자녀 맞춤 목록 (홈 「더보기」) */
    recommended: (childId: string) => `${RECOMMENDED}/${childId}`,
    cart: '/cart',
    orders: '/orders',
    order: (id: string) => `/orders/${id}`,
    /** 알림함 (알림 기능 전, 화면만) */
    notifications: '/notifications',
    my: '/my',
    children: '/my/children',
    /** 자녀 등록 (목록과 따로) */
    childNew: '/my/children/new',
    child: (id: string) => `/my/children/${id}`,
    profile: '/my/profile',
    addresses: '/my/addresses',
    wallet: '/my/wallet',
    /** 예치금 이용 내역 · 충전 내역 (예치금과 따로) */
    walletHistory: '/my/wallet/history',
    /** 예치금 충전 (예치금과 따로, 메뉴 없이 한 가지 일만) */
    walletCharge: '/my/wallet/charge',
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
    member: (id: string) => `/admin/members/${id}`,
    sellerApplications: '/admin/seller-applications',
    orders: '/admin/orders',
    order: (id: string) => `/admin/orders/${id}`,
    products: '/admin/products',
    payments: '/admin/payments',
    payment: (id: string) => `/admin/payments/${id}`,
    settlements: '/admin/settlements',
    settings: '/admin/settings',
    /** 상품 기준 데이터: 종류마다 목록 · 만들기(목록과 따로) */
    attributes: '/admin/catalog/attributes',
    attributeNew: '/admin/catalog/attributes/new',
    attribute: (id: string) => `/admin/catalog/attributes/${id}`,
    measurementItems: '/admin/catalog/measurement-items',
    measurementItemNew: '/admin/catalog/measurement-items/new',
    productTypes: '/admin/catalog/product-types',
    productTypeNew: '/admin/catalog/product-types/new',
    categories: '/admin/catalog/categories',
    categoryNew: '/admin/catalog/categories/new',
  },
  console: {
    home: C,
    verify: `${C}/verify`,
    connect: `${C}/connect`,
    children: `${C}/children`,
    childNew: `${C}/children/new`,
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
    walletHistory: `${C}/wallet/history`,
    walletCharge: `${C}/wallet/charge`,
    chargeSuccess: `${C}/wallet/charge/success`,
    chargeFail: `${C}/wallet/charge/fail`,
    sellerApply: `${C}/seller/apply`,
    sellerProducts: `${C}/seller/products`,
    sellerOrders: `${C}/seller/orders`,
    sellerSettlements: `${C}/seller/settlements`,
    adminSellerApplications: `${C}/admin/seller-applications`,
    adminSettlements: `${C}/admin/settlements`,
    adminMembers: `${C}/admin/members`,
    adminMember: (id: string) => `${C}/admin/members/${id}`,
    adminOrders: `${C}/admin/orders`,
    adminOrder: (id: string) => `${C}/admin/orders/${id}`,
    adminProducts: `${C}/admin/products`,
    adminPayments: `${C}/admin/payments`,
    adminPayment: (id: string) => `${C}/admin/payments/${id}`,
  },
} as const

/** 영역마다 따로 있는 예치금 · 충전 결과 화면 (충전은 쇼핑 · 콘솔에서만) */
export function walletPathsOf(area: Area) {
  const base = area === 'console' ? paths.console : paths.shop
  return {
    wallet: base.wallet,
    history: base.walletHistory,
    charge: base.walletCharge,
    chargeSuccess: base.chargeSuccess,
    chargeFail: base.chargeFail,
  }
}

/** 관리자 화면 (회원 · 주문 · 결제의 목록 · 상세): 콘솔은 콘솔 안, 나머지는 관리자 */
export function adminPathsOf(area: Area) {
  if (area === 'console') {
    const c = paths.console
    return {
      members: c.adminMembers,
      member: c.adminMember,
      orders: c.adminOrders,
      order: c.adminOrder,
      payments: c.adminPayments,
      payment: c.adminPayment,
    }
  }
  const { members, member, orders, order, payments, payment } = paths.admin
  return { members, member, orders, order, payments, payment }
}

/** 영역마다 있는 회원 · 자녀 화면 (판매자 센터 · 관리자에서는 쇼핑 화면으로) */
export function memberPathsOf(area: Area) {
  const base = area === 'console' ? paths.console : paths.shop
  return {
    children: base.children,
    childNew: base.childNew,
    child: base.child,
    addresses: base.addresses,
    profile: base.profile,
  }
}

/** 로그인해야 볼 수 있는 쇼핑 화면: 맞춤 목록 · 장바구니 · 주문 · 알림함 · 마이페이지(자녀 · 배송지 · 예치금 포함). 홈 · 상품은 누구나 */
export function shopNeedsLogin(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return [
    RECOMMENDED,
    paths.shop.cart,
    paths.shop.orders,
    paths.shop.notifications,
    paths.shop.my,
  ].some((prefix) => under(prefix, path))
}

/** 로그인 화면 주소. next = 로그인 뒤 돌아올 화면 (앱 안 주소만) */
export function loginPath(next: string | null): string {
  const target = safeReturnPath(next)
  return target ? `${paths.login}?next=${encodeURIComponent(target)}` : paths.login
}
