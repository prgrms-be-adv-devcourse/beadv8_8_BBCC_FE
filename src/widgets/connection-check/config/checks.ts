import { addressApi } from '@/entities/address'
import { cartApi } from '@/entities/cart'
import { childApi } from '@/entities/child'
import { adminMemberApi } from '@/entities/member'
import { orderApi } from '@/entities/order'
import { paymentApi } from '@/entities/payment'
import { productApi } from '@/entities/product'
import { recommendationApi } from '@/entities/recommendation'
import { sellerApi } from '@/entities/seller'
import { sellerOrderApi } from '@/entities/seller-order'
import { type Role, sessionApi } from '@/entities/session'
import { walletApi } from '@/entities/wallet'

/** 앞 점검에서 받아 뒤 점검에 넘기는 ID (상세 조회용) */
export type CheckIds = Partial<
  Record<'productId' | 'childId' | 'orderId' | 'paymentId' | 'chargeId', string>
>

export type ConnectionCheck = {
  id: string
  /** 화면에 보일 이름 */
  label: string
  /** "GET /orders/{id}" */
  api: string
  /** 이 역할이 있어야 부른다. null이면 로그인만, 'PUBLIC'이면 로그인 없이 */
  role: Role | null | 'PUBLIC'
  /** 상세 조회처럼 앞 결과의 ID가 필요하면 그 이름 */
  needs?: keyof CheckIds
  /** 조회만 한다 (바꾸는 요청은 넣지 않는다) */
  run: (ids: CheckIds) => Promise<unknown>
  /** 응답에서 뒤 점검이 쓸 ID를 꺼낸다 */
  pick?: (data: unknown) => CheckIds
}

type Paged = { content: Record<string, unknown>[] }
const idOf = (value: unknown) =>
  value === undefined || value === null ? undefined : String(value as string | number)
const first = (data: unknown, key: string) => idOf((data as Paged).content?.[0]?.[key])
const firstOf = (data: unknown, key: string) => idOf((data as Record<string, unknown>[])[0]?.[key])

/** 시연 흐름 순서. 실제 API(목이 아닌 것)만 넣는다 */
export const CONNECTION_CHECKS: ConnectionCheck[] = [
  {
    id: 'categories',
    label: '카테고리',
    api: 'GET /categories',
    role: 'PUBLIC',
    run: () => productApi.categories(),
  },
  {
    id: 'products',
    label: '상품 목록',
    api: 'GET /products',
    role: 'PUBLIC',
    run: () => productApi.list(),
    pick: (data) => ({ productId: first(data, 'productId') }),
  },
  {
    id: 'product',
    label: '상품 상세',
    api: 'GET /products/{id}',
    role: 'PUBLIC',
    needs: 'productId',
    run: (ids) => productApi.get(ids.productId!),
  },
  { id: 'me', label: '내 정보', api: 'GET /members/me', role: null, run: () => sessionApi.getMe() },
  {
    id: 'addresses',
    label: '배송지',
    api: 'GET /members/me/addresses',
    role: null,
    run: () => addressApi.list(),
  },
  {
    id: 'children',
    label: '자녀 목록',
    api: 'GET /children',
    role: null,
    run: () => childApi.list(),
    pick: (data) => ({ childId: firstOf(data, 'childId') ?? firstOf(data, 'id') }),
  },
  {
    id: 'growth',
    label: '성장 기록',
    api: 'GET /children/{id}/growth-records',
    role: null,
    needs: 'childId',
    run: (ids) => childApi.growthRecords(ids.childId!),
  },
  {
    id: 'size',
    label: '사이즈 추천',
    api: 'GET /products/{id}/size-recommendation',
    role: null,
    needs: 'childId',
    run: (ids) => {
      if (!ids.productId) throw new MissingId('productId')
      return recommendationApi.getSize(ids.productId, ids.childId!)
    },
  },
  {
    id: 'seller-application',
    label: '판매자 신청',
    api: 'GET /members/me/seller-application',
    role: null,
    run: () => sellerApi.getMyApplication(),
  },
  {
    id: 'wallet',
    label: '예치금',
    api: 'GET /wallets/me',
    role: null,
    run: () => walletApi.getMine(),
  },
  {
    id: 'charges',
    label: '충전 내역',
    api: 'GET /wallets/me/charges',
    role: null,
    run: () => walletApi.listCharges(),
    pick: (data) => ({ chargeId: first(data, 'chargeId') }),
  },
  {
    id: 'charge',
    label: '충전 상세',
    api: 'GET /wallets/me/charges/{id}',
    role: null,
    needs: 'chargeId',
    run: (ids) => walletApi.getCharge(ids.chargeId!),
  },
  {
    id: 'ledgers',
    label: '입출금 내역',
    api: 'GET /wallets/me/ledgers',
    role: null,
    run: () => walletApi.listTransactions(),
  },
  { id: 'cart', label: '장바구니', api: 'GET /cart', role: null, run: () => cartApi.get() },
  {
    id: 'orders',
    label: '주문 내역',
    api: 'GET /orders',
    role: null,
    run: () => orderApi.list(),
    pick: (data) => ({ orderId: first(data, 'orderId') }),
  },
  {
    id: 'order',
    label: '주문 상세',
    api: 'GET /orders/{id}',
    role: null,
    needs: 'orderId',
    run: (ids) => orderApi.get(ids.orderId!),
  },
  {
    id: 'payments',
    label: '결제 내역',
    api: 'GET /payments',
    role: null,
    run: () => paymentApi.list(),
    pick: (data) => ({ paymentId: first(data, 'paymentId') }),
  },
  {
    id: 'payment',
    label: '결제 상세',
    api: 'GET /payments/{id}',
    role: null,
    needs: 'paymentId',
    run: (ids) => paymentApi.get(ids.paymentId!),
  },
  {
    id: 'seller-me',
    label: '판매자 정보',
    api: 'GET /seller/me',
    role: 'SELLER',
    run: () => sellerApi.getMine(),
  },
  {
    id: 'seller-orders',
    label: '판매 주문',
    api: 'GET /seller/orders',
    role: 'SELLER',
    run: () => sellerOrderApi.list(),
  },
  {
    id: 'admin-members',
    label: '회원 관리',
    api: 'GET /admin/members',
    role: 'ADMIN',
    run: () => adminMemberApi.list('ALL', ''),
  },
  {
    id: 'admin-applications',
    label: '판매자 신청 심사',
    api: 'GET /admin/seller-applications',
    role: 'ADMIN',
    run: () => sellerApi.listApplications(null),
  },
]

/** 상세 조회에 필요한 ID가 앞 결과에 없을 때 */
export class MissingId extends Error {
  readonly key: string
  constructor(key: string) {
    super(`${key} 없음`)
    this.key = key
  }
}
