// 시연용 고정 데이터. 기획서 v1.0 3.3 모듈 연결 지도 · 8장 이벤트 표를 옮겼다 (실제 이벤트 로그가 아니다)

export type DomainId =
  'member' | 'product' | 'recommend' | 'order' | 'payment' | 'settlement' | 'toss' | 'kakao'

export const DOMAINS: { id: DomainId; name: string; external?: boolean }[] = [
  { id: 'member', name: '회원' },
  { id: 'product', name: '상품' },
  { id: 'recommend', name: '추천' },
  { id: 'order', name: '주문' },
  { id: 'payment', name: '결제' },
  { id: 'settlement', name: '정산' },
  { id: 'kakao', name: '카카오', external: true },
  { id: 'toss', name: '토스', external: true },
]

/** API 경로 → 처리하는 도메인. 위에서부터 먼저 맞는 것 */
const PATH_DOMAINS: [RegExp, DomainId][] = [
  [/^\/products\/[^/]+\/size-recommendation/, 'recommend'],
  [/^\/children\/[^/]+\/recommended-products/, 'recommend'],
  [/^\/(seller\/)?products/, 'product'],
  [/^\/(cart|orders|seller\/orders)/, 'order'],
  [/^\/(wallets|payments)/, 'payment'],
  [/^\/(seller\/settlement|admin\/settlements)/, 'settlement'],
  [/^\/(auth|members|children|dev|admin\/(members|seller|sellers)|seller\/me)/, 'member'],
]

export function domainOf(path: string): DomainId | null {
  const pathname = path.split('?')[0]
  return PATH_DOMAINS.find(([pattern]) => pattern.test(pathname))?.[1] ?? null
}

/** 서버가 이 API 뒤에 이어서 하는 일 (도메인 간 이벤트 · 외부 API) */
export type FlowStep = {
  name: string
  from: DomainId
  to: DomainId[]
  description: string
  kind: 'event' | 'external'
}

const FLOWS: { method: string; pattern: RegExp; steps: FlowStep[] }[] = [
  {
    method: 'POST',
    pattern: /^\/auth\/login\/kakao$/,
    steps: [
      {
        name: '카카오 토큰 · 사용자 조회',
        from: 'member',
        to: ['kakao'],
        description: '인가 코드로 카카오 사용자 확인',
        kind: 'external',
      },
      {
        name: 'member.registered',
        from: 'member',
        to: ['payment'],
        description: '처음 로그인이면 가입 → 예치금 지갑 생성',
        kind: 'event',
      },
    ],
  },
  {
    method: 'POST',
    pattern: /^\/children$/,
    steps: [
      {
        name: 'child.changed',
        from: 'member',
        to: ['recommend', 'order'],
        description: '추천 · 주문이 자녀 정보 복사본 저장',
        kind: 'event',
      },
    ],
  },
  {
    method: 'POST',
    pattern: /^\/seller\/products\/[^/]+\/start-sale$/,
    steps: [
      {
        name: 'product.changed',
        from: 'product',
        to: ['recommend', 'order'],
        description: '추천 · 주문이 상품 · 옵션 · 단가 복사본 저장',
        kind: 'event',
      },
    ],
  },
  {
    method: 'POST',
    pattern: /^\/wallets\/me\/charges\/confirm$/,
    steps: [
      {
        name: '토스 결제 승인',
        from: 'payment',
        to: ['toss'],
        description: 'paymentKey로 승인 요청 (민감 값은 암호화 저장) → 지갑 잔액 증가',
        kind: 'external',
      },
    ],
  },
  {
    method: 'POST',
    pattern: /^\/wallets\/me\/charges\/[^/]+\/cancel$/,
    steps: [
      {
        name: '토스 결제 취소',
        from: 'payment',
        to: ['toss'],
        description: '암호화해 둔 paymentKey를 복호화해 취소 요청 → 지갑 잔액 차감',
        kind: 'external',
      },
    ],
  },
  {
    method: 'POST',
    pattern: /^\/orders$/,
    steps: [
      {
        name: 'order.created',
        from: 'order',
        to: ['product'],
        description: '주문 저장(결제대기) → 상품이 재고 차감(선점)',
        kind: 'event',
      },
      {
        name: 'stock.deducted',
        from: 'product',
        to: ['order'],
        description: '재고 확보 완료 → 주문이 결제 요청',
        kind: 'event',
      },
      {
        name: 'order.payment-requested',
        from: 'order',
        to: ['payment'],
        description: '결제가 예치금에서 주문 금액 차감',
        kind: 'event',
      },
      {
        name: 'payment.completed',
        from: 'payment',
        to: ['order'],
        description: '주문 PAID (실패하면 주문 취소 · 재고 복구)',
        kind: 'event',
      },
    ],
  },
  {
    method: 'POST',
    pattern: /^\/orders\/[^/]+\/items\/[^/]+\/confirm$/,
    steps: [
      {
        name: 'order-item.purchase-confirmed',
        from: 'order',
        to: ['settlement', 'recommend'],
        description: '정산 대상 등록 · 구매 기록 저장',
        kind: 'event',
      },
    ],
  },
  {
    method: 'POST',
    pattern: /^\/admin\/settlements\/run$/,
    steps: [
      {
        name: 'settlement.completed',
        from: 'settlement',
        to: ['payment'],
        description: '수수료 10% 뺀 금액을 판매자 지갑에 적립',
        kind: 'event',
      },
    ],
  },
]

export function flowOf(method: string, path: string): FlowStep[] {
  const pathname = path.split('?')[0]
  return FLOWS.find((flow) => flow.method === method && flow.pattern.test(pathname))?.steps ?? []
}
