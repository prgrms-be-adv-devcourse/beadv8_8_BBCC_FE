import { paths } from '@/shared/config'

/** 시연 역할 (위 막대의 시연 역할 버튼 이름) */
export type DemoActor = '보호자' | '판매자' | '관리자'

/** 콘솔 화면 하나의 시연 안내. 말할 문장은 대본 문서에 두고, 여기에는 행동만 쓴다 */
export type DemoGuide = {
  /** ①~⑦ · 시작 · 확인 */
  step: string
  /** 이 화면을 쓰는 시연 역할 (null = 아무 역할) */
  actor: DemoActor | null
  /** 누를 것 · 볼 것 (순서대로) */
  todo: string[]
  /** 오른쪽 흐름 패널에서 짚을 것 */
  watch: string
  next: { label: string; to: string } | null
}

const C = paths.console

/** 콘솔 주소(`:id`는 상세) → 안내. 기획서 7장 정상 흐름 ①~⑦ 순서 */
export const DEMO_GUIDES: { path: string; guide: DemoGuide }[] = [
  {
    path: C.home,
    guide: {
      step: '시작',
      actor: '보호자',
      todo: ['보호자로 시작해요', '오른쪽 흐름 패널의 "지우기"로 기록을 비워 두면 보기 좋아요'],
      watch: '화면을 누를 때마다 호출한 API와 서버에서 이어지는 이벤트가 쌓여요',
      next: { label: '① 자녀 등록', to: C.children },
    },
  },
  {
    path: C.children,
    guide: {
      step: '①',
      actor: '보호자',
      todo: ['"등록하기"로 시연 자녀(115cm)를 등록해요'],
      watch: 'POST /children → 서버 이벤트 child.changed (추천 · 주문이 복사본 저장)',
      next: { label: '① 배송지 등록', to: C.addresses },
    },
  },
  {
    path: C.addresses,
    guide: {
      step: '①',
      actor: '보호자',
      todo: ['"등록하기"로 기본 배송지를 등록해요'],
      watch: 'POST /members/me/addresses — 주문 때 화면이 이 배송지를 요청에 담아요',
      next: { label: '② 판매자 신청', to: C.sellerApply },
    },
  },
  {
    path: C.sellerApply,
    guide: {
      step: '②',
      actor: '보호자',
      todo: ['"신청하기"를 눌러요'],
      watch: 'POST /members/me/seller-application → 상태 변화 탭: 판매자 신청 PENDING',
      next: { label: '② 관리자 승인', to: C.adminSellerApplications },
    },
  },
  {
    path: C.adminSellerApplications,
    guide: {
      step: '②',
      actor: '관리자',
      todo: ['"승인"을 눌러요 (거절하면 사유를 남기고 다시 신청할 수 있어요)'],
      watch: '상태 변화 탭: 판매자 신청 PENDING → APPROVED, 다음 토큰부터 SELLER 역할',
      next: { label: '② 상품 등록', to: C.sellerProducts },
    },
  },
  {
    path: C.sellerProducts,
    guide: {
      step: '②',
      actor: '판매자',
      todo: ['카테고리 항목에 맞춰 "등록하기"로 상품을 만들고', '"판매 시작"을 눌러요'],
      watch:
        'PUT sale-status → 서버 이벤트 product.changed (추천 · 주문 복사본 갱신). 등록 · 판매 시작은 실제, 내 상품 목록은 목',
      next: { label: '③ 사이즈 추천', to: C.products },
    },
  },
  {
    path: C.products,
    guide: {
      step: '③',
      actor: '보호자',
      todo: [
        '자녀 버튼("테스트 맞춤")을 눌러 맞는 사이즈가 있는 상품만 봐요',
        '상품 A를 눌러 상세로 가요',
      ],
      watch: 'GET /children/{id}/recommended-products — 추천이 자기 복사본으로 계산 (목)',
      next: { label: '④ 장바구니', to: C.cart },
    },
  },
  {
    path: `${C.products}/:id`,
    guide: {
      step: '③',
      actor: '보호자',
      todo: ['"추천 사이즈"를 확인하고 그 옵션을 골라요', '"장바구니 담기"를 눌러요'],
      watch:
        'GET /products/{id}/size-recommendation → 추천 · 적합도 · 후보 · 안내, POST /cart/items',
      next: { label: '④ 예치금 확인', to: C.wallet },
    },
  },
  {
    path: C.wallet,
    guide: {
      step: '④',
      actor: '보호자',
      todo: ['잔액이 주문 금액보다 많은지 봐요 (충전은 토스 테스트 결제)'],
      watch: 'GET /wallets/me — 결제는 이 예치금에서 빠져요',
      next: { label: '④ 장바구니', to: C.cart },
    },
  },
  {
    path: C.cart,
    guide: {
      step: '④',
      actor: '보호자',
      todo: [
        '배송지를 확인하고 "주문하기"를 눌러요',
        '주문 상세로 이동해 결제 완료가 될 때까지 봐요',
      ],
      watch: 'POST /orders → PENDING_PAYMENT → order.created → stock.deducted → payment.completed',
      next: { label: '⑤ 판매자 발송', to: C.sellerOrders },
    },
  },
  {
    path: `${C.orders}/:id`,
    guide: {
      step: '④ · ⑥',
      actor: '보호자',
      todo: [
        '④ "결제 완료"와 결제 확인 "일치"를 봐요',
        '⑥ 발송 · 배송 완료 뒤에는 여기서 "구매확정"을 눌러요',
      ],
      watch: '상태 변화 탭: 주문 PENDING_PAYMENT → PAID, 결제 기록과 금액 비교',
      next: { label: '⑤ 판매자 발송', to: C.sellerOrders },
    },
  },
  {
    path: C.sellerOrders,
    guide: {
      step: '⑤',
      actor: '판매자',
      todo: ['송장을 넣고 "발송"을 눌러요', '"배송 완료 처리"를 눌러요'],
      watch: '상태 변화 탭: 배송 READY → SHIPPING → DELIVERED',
      next: { label: '⑥ 구매확정', to: C.orders },
    },
  },
  {
    path: C.orders,
    guide: {
      step: '⑥',
      actor: '보호자',
      todo: ['방금 주문을 열고 "구매확정"을 눌러요'],
      watch: 'POST .../confirm → order-item.purchase-confirmed (정산 대상이 돼요)',
      next: { label: '⑦ 정산 실행', to: C.adminSettlements },
    },
  },
  {
    path: C.adminSettlements,
    guide: {
      step: '⑦',
      actor: '관리자',
      todo: [
        '"정산 실행"을 눌러요 (원래는 매월 자동)',
        '기준일은 오늘이라 어제까지 구매확정분이 대상이에요. 오늘 구매확정분은 내일 정산돼요',
      ],
      watch:
        'POST /admin/settlements/run → settlement.payout-requested → payment.payout-completed → 판매자 예치금 입금',
      next: { label: '⑦ 정산서', to: C.sellerSettlements },
    },
  },
  {
    path: C.sellerSettlements,
    guide: {
      step: '⑦',
      actor: '판매자',
      todo: [
        '정산서 "상세"에서 수수료 10%를 뺀 지급액을 봐요',
        '오늘 구매확정한 상품은 "정산 대상"에 있다가 내일 정산돼요',
      ],
      watch: 'GET /seller/settlements — 구매확정 → 정산 → 예치금 입금(지급 완료)까지 이어진 결과',
      next: { label: '흐름 확인', to: C.verify },
    },
  },
  {
    path: C.verify,
    guide: {
      step: '확인',
      actor: null,
      todo: [
        '정상 흐름 통과 수와 실패 0을 봐요',
        '"결과 복사" · 흐름 패널 "기록 내보내기"로 남겨요',
      ],
      watch: '기획서 7장 완료 기준을 호출 기록으로 자동 판정해요',
      next: null,
    },
  },
]
