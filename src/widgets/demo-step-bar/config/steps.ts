import type { Role } from '@/entities/session'
import { paths } from '@/shared/config'

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
      { to: paths.console.children, label: '자녀', role: 'BUYER' },
      { to: paths.console.addresses, label: '배송지', role: 'BUYER' },
      { to: paths.console.profile, label: '내 정보', role: 'BUYER' },
    ],
  },
  {
    step: '②',
    title: '판매자 · 상품',
    links: [
      { to: paths.console.sellerApply, label: '판매자 신청', role: 'BUYER' },
      { to: paths.console.adminSellerApplications, label: '승인', role: 'ADMIN' },
      { to: paths.console.sellerProducts, label: '상품 등록', role: 'SELLER' },
    ],
  },
  {
    step: '③',
    title: '사이즈 추천',
    links: [{ to: paths.console.products, label: '상품', role: 'BUYER' }],
  },
  {
    step: '④',
    title: '주문 · 결제',
    links: [
      { to: paths.console.wallet, label: '예치금', role: 'BUYER' },
      { to: paths.console.cart, label: '장바구니', role: 'BUYER' },
    ],
  },
  {
    step: '⑤',
    title: '배송',
    links: [{ to: paths.console.sellerOrders, label: '판매 주문', role: 'SELLER' }],
  },
  {
    step: '⑥',
    title: '구매확정',
    links: [{ to: paths.console.orders, label: '내 주문', role: 'BUYER' }],
  },
  {
    step: '⑦',
    title: '정산',
    links: [
      { to: paths.console.adminSettlements, label: '정산 실행', role: 'ADMIN' },
      { to: paths.console.sellerSettlements, label: '정산서', role: 'SELLER' },
    ],
  },
  {
    step: '관리',
    title: '관리자 보완',
    links: [
      { to: paths.console.adminMembers, label: '회원', role: 'ADMIN' },
      { to: paths.console.adminProducts, label: '상품', role: 'ADMIN' },
      { to: paths.console.adminOrders, label: '주문', role: 'ADMIN' },
      { to: paths.console.adminPayments, label: '결제', role: 'ADMIN' },
    ],
  },
]
