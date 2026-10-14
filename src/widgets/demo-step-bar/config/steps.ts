import type { Role } from '@/entities/session'

/** 기획서 7장 정상 흐름 ①~⑦과 그 단계의 화면 */
export const DEMO_STEPS: {
  step: string
  title: string
  links: { to: string; label: string; role: Role }[]
}[] = [
  {
    step: '①',
    title: '회원 · 자녀',
    links: [
      { to: '/children', label: '자녀', role: 'BUYER' },
      { to: '/addresses', label: '배송지', role: 'BUYER' },
    ],
  },
  {
    step: '②',
    title: '판매자 · 상품',
    links: [
      { to: '/seller/apply', label: '판매자 신청', role: 'BUYER' },
      { to: '/admin/seller-applications', label: '승인', role: 'ADMIN' },
      { to: '/seller/products', label: '상품 등록', role: 'SELLER' },
    ],
  },
  { step: '③', title: '사이즈 추천', links: [{ to: '/products', label: '상품', role: 'BUYER' }] },
  {
    step: '④',
    title: '주문 · 결제',
    links: [
      { to: '/wallet', label: '예치금', role: 'BUYER' },
      { to: '/cart', label: '장바구니', role: 'BUYER' },
    ],
  },
  {
    step: '⑤',
    title: '배송',
    links: [{ to: '/seller/orders', label: '판매 주문', role: 'SELLER' }],
  },
  { step: '⑥', title: '구매확정', links: [{ to: '/orders', label: '내 주문', role: 'BUYER' }] },
  {
    step: '⑦',
    title: '정산',
    links: [
      { to: '/admin/settlements', label: '정산 실행', role: 'ADMIN' },
      { to: '/seller/settlements', label: '정산서', role: 'SELLER' },
    ],
  },
]

export const ROLE_LABEL: Record<Role, string> = {
  BUYER: '보호자',
  SELLER: '판매자',
  ADMIN: '관리자',
}
