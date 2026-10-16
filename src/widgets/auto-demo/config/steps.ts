import { addressApi } from '@/entities/address'
import { cartApi } from '@/entities/cart'
import { childApi } from '@/entities/child'
import { orderApi, toPlaceOrderRequest } from '@/entities/order'
import {
  productApi,
  toCategories,
  toCategoryInputs,
  toRegisterProductRequest,
} from '@/entities/product'
import { recommendationApi } from '@/entities/recommendation'
import { sellerApi, toSellerApplicationRequest } from '@/entities/seller'
import { DEMO_APPLICATION } from '@/features/apply-seller'
import { sellerOrderApi } from '@/entities/seller-order'
import { settlementApi } from '@/entities/settlement'
import { walletApi } from '@/entities/wallet'
import { demoCategoryId, demoRegisterForm } from '@/features/register-product'
import { settlementPeriodEnd } from '@/features/run-settlement'
import { getErrorStatus } from '@/shared/api'
import { paths } from '@/shared/config'
import { newRequestKey } from '@/shared/lib'

export type DemoRole = '보호자' | '판매자' | '관리자'

/** 단계 사이에 이어 쓰는 값 (만든 자녀 · 상품 · 주문) */
export type AutoDemoData = {
  stamp: string
  childId?: string
  address?: { recipientName: string; phone: string; zipCode: string; address: string }
  productId?: string
  options?: { optionId: string; optionName: string; price: number }[]
  optionId?: string
  orderId?: string
}

export type AutoDemoContext = {
  data: AutoDemoData
  /** 역할 바꾸기 (개발용 토큰) */
  as: (role: DemoRole) => Promise<void>
  /** 화면 이동 → 잠깐 보여 줌 (발표 속도일 때) */
  show: (path: string, message: string) => Promise<void>
  /** API 호출을 흐름 패널에 "자동 시연 · 이름"으로 남기고, 끝나면 화면 데이터를 다시 받는다 */
  call: <T>(name: string, fn: () => Promise<T>) => Promise<T>
  /** 단계 안에서 기다리기 (일시정지 · 멈춤을 확인한다) */
  wait: (ms: number) => Promise<void>
  say: (message: string) => void
}

export class AutoDemoError extends Error {}

export type AutoDemoStep = {
  no: string
  title: string
  run: (ctx: AutoDemoContext) => Promise<void>
}

const C = paths.console

export const AUTO_DEMO_STEPS: AutoDemoStep[] = [
  {
    no: '①',
    title: '자녀 · 배송지 등록',
    run: async (ctx) => {
      await ctx.as('보호자')
      await ctx.show(C.children, '보호자: 자녀 등록')
      const child = await ctx.call('자녀 등록', () =>
        childApi.register({
          name: `자동 ${ctx.data.stamp}`,
          birthDate: '2019-05-01',
          gender: 'FEMALE',
          heightCm: 118,
          weightKg: 21,
          bodyType: 'NORMAL',
          preferredFit: null,
        }),
      )
      ctx.data.childId = String(child.id)
      await ctx.show(C.addresses, '보호자: 배송지 등록')
      const address = await ctx.call('배송지 등록', () =>
        addressApi.create({
          recipientName: '보호자',
          recipientPhone: '010-1234-5678',
          zipCode: '06236',
          roadAddress: '서울 강남구 테헤란로 123',
          detailAddress: `자동 시연 ${ctx.data.stamp}`,
          isDefault: true,
        }),
      )
      ctx.data.address = {
        recipientName: address.recipientName,
        phone: address.recipientPhone,
        zipCode: address.zipCode,
        address: [address.roadAddress, address.detailAddress].filter(Boolean).join(' '),
      }
    },
  },
  {
    no: '②',
    title: '판매자 신청 · 승인 · 상품 등록',
    run: async (ctx) => {
      await ctx.show(C.sellerApply, '보호자: 판매자 신청')
      let application = await ctx.call('내 판매자 신청', () => sellerApi.getMyApplication())
      if (!application || application.status === 'REJECTED') {
        await ctx.call('판매자 신청', () =>
          // 판매자 신청 화면과 같은 시연 값 (BE: 사업자등록번호는 하이픈 없는 숫자 10자리)
          sellerApi.apply(toSellerApplicationRequest(DEMO_APPLICATION)),
        )
        application = await sellerApi.getMyApplication()
      }
      if (application && application.status !== 'APPROVED') {
        await ctx.as('관리자')
        await ctx.show(C.adminSellerApplications, '관리자: 판매자 신청 승인')
        await ctx.call('판매자 승인', () => sellerApi.approve(String(application!.id)))
      } else {
        ctx.say('이미 승인된 판매자 신청 → 건너뜀')
      }
      await ctx.as('판매자')
      await ctx.show(C.sellerProducts, '판매자: 상품 등록 (카테고리 입력 항목으로)')
      const categories = toCategories(await productApi.categories())
      const categoryId = demoCategoryId(categories)
      if (!categoryId)
        throw new AutoDemoError(
          '카테고리가 없어요 (서버에 상품 카테고리 데이터가 없음 · 백엔드 초기 데이터 필요)',
        )
      const inputs = toCategoryInputs(await productApi.categoryInputs(categoryId))
      const form = { ...demoRegisterForm(inputs), name: `데일리 맨투맨 (자동 ${ctx.data.stamp})` }
      const result = await ctx.call('상품 등록', () =>
        productApi.register(toRegisterProductRequest(inputs, form)),
      )
      ctx.data.productId = result.productId
      ctx.data.options = result.options.map((option) => ({
        optionId: option.optionId,
        optionName: option.optionName,
        price: option.price,
      }))
      await ctx.call('판매 시작', () => productApi.startSale(result.productId))
    },
  },
  {
    no: '③',
    title: '사이즈 추천 · 착용 미리보기',
    run: async (ctx) => {
      await ctx.as('보호자')
      await ctx.show(
        C.product(ctx.data.productId!, ctx.data.childId),
        '보호자: 상품 상세에서 자녀 사이즈 추천',
      )
      const recommendation = await ctx.call('사이즈 추천', () =>
        recommendationApi.getSize(ctx.data.productId!, ctx.data.childId!),
      )
      const size = recommendation.recommendedSize
      const option =
        ctx.data.options!.find((item) => size && item.optionName.includes(size)) ??
        ctx.data.options![0]
      ctx.data.optionId = option.optionId
      ctx.say(`추천 사이즈 ${size ?? '없음'} → 옵션 ${option.optionName}`)
      await ctx.wait(1500)
    },
  },
  {
    no: '④',
    title: '담기 · 주문 · 결제 완료',
    run: async (ctx) => {
      const option = ctx.data.options!.find((item) => item.optionId === ctx.data.optionId)!
      const wallet = await walletApi.getMine()
      if (wallet.balance < option.price) {
        throw new AutoDemoError(
          `예치금이 모자라요 (잔액 ${wallet.balance.toLocaleString()}원 · 필요 ${option.price.toLocaleString()}원). 충전 먼저 해 주세요`,
        )
      }
      await ctx.call('장바구니 담기', () =>
        cartApi.addItem({
          optionId: Number(option.optionId),
          childId: Number(ctx.data.childId),
          quantity: 1,
        }),
      )
      await ctx.show(C.cart, '보호자: 장바구니 → 주문하기')
      const cart = await cartApi.get()
      const line = cart.items.find((item) => String(item.optionId) === option.optionId)
      const order = await ctx.call('주문하기', () =>
        orderApi.place(
          toPlaceOrderRequest({
            items: [
              {
                optionId: option.optionId,
                childId: ctx.data.childId ?? null,
                quantity: 1,
                unitPrice: line?.unitPrice ?? option.price,
              },
            ],
            shippingAddress: ctx.data.address!,
          }),
          newRequestKey(),
        ),
      )
      ctx.data.orderId = String(order.orderId)
      await ctx.show(C.order(ctx.data.orderId), '주문 상세: 서버가 재고 차감 → 예치금 결제')
      for (let second = 0; second < 30; second += 1) {
        const current = await orderApi.get(ctx.data.orderId)
        if (current.status === 'PAID') return
        if (current.status === 'CANCELLED') {
          throw new AutoDemoError(`주문이 취소됐어요 (${current.cancelReason ?? '이유 없음'})`)
        }
        ctx.say(`결제 완료 기다리는 중 ${second + 1}초`)
        await ctx.wait(1000)
      }
      throw new AutoDemoError(
        '30초 동안 결제 결과가 없어요 (백엔드 흐름 막힘: order.created → stock.deducted 확인 필요)',
      )
    },
  },
  {
    no: '⑤',
    title: '발송 · 배송 완료',
    run: async (ctx) => {
      await ctx.as('판매자')
      await ctx.show(C.sellerOrders, '판매자: 발송 → 배송 완료')
      const page = await sellerOrderApi.list()
      const sellerOrder = page.content.find((item) => String(item.orderId) === ctx.data.orderId)
      if (!sellerOrder) throw new AutoDemoError('판매 주문 목록에 이 주문이 없어요')
      await ctx.call('발송', () =>
        sellerOrderApi.ship(sellerOrder.sellerOrderId, {
          carrier: 'CJ대한통운',
          trackingNumber: `AUTO${Date.now().toString().slice(-8)}`,
        }),
      )
      await ctx.wait(800)
      await ctx.call('배송 완료', () => sellerOrderApi.deliver(sellerOrder.sellerOrderId))
    },
  },
  {
    no: '⑥',
    title: '구매확정',
    run: async (ctx) => {
      await ctx.as('보호자')
      await ctx.show(C.order(ctx.data.orderId!), '보호자: 구매확정')
      const order = await orderApi.get(ctx.data.orderId!)
      for (const item of order.items) {
        await ctx.call('구매확정', () =>
          orderApi.confirmItem(ctx.data.orderId!, String(item.orderItemId)),
        )
      }
      // 구매확정 뒤 주문 상세를 다시 받아 정산 대상(목)에 옮겨진다
      await orderApi.get(ctx.data.orderId!)
    },
  },
  {
    no: '⑦',
    title: '정산',
    run: async (ctx) => {
      await ctx.as('관리자')
      await ctx.show(C.adminSettlements, '관리자: 정산 실행 (오늘 구매확정분까지)')
      try {
        await ctx.call('정산 실행', () =>
          settlementApi.run({ cutoffOn: settlementPeriodEnd(new Date(), true) }),
        )
      } catch (error) {
        // 같은 기준일로 이미 실행했으면 409 (오늘 두 번째 자동 시연). 정산서 화면은 그대로 본다
        if (getErrorStatus(error) !== 409) throw error
        ctx.say('오늘 기준일 정산은 이미 실행됨 → 정산서 확인')
      }
      await ctx.as('판매자')
      await ctx.show(C.sellerSettlements, '판매자: 정산서 확인')
      await ctx.wait(1000)
    },
  },
]
