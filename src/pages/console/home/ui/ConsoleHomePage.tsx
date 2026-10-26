import { Link } from 'react-router'
import { useSessionStore } from '@/entities/session'
import { paths } from '@/shared/config'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ResetDemoButton } from '@/features/reset-demo'

const FAILURE_SCENARIOS = [
  [
    '잔액 부족',
    paths.console.products,
    '상품 상세에서 수량을 늘려 잔액보다 큰 금액을 주문 → 주문 취소(PAYMENT_FAILED) · 결제 카드 FAILED · 예치금 그대로',
  ],
  [
    '재고 부족',
    paths.console.products,
    '재고보다 많은 수량을 주문 → 주문 취소(OUT_OF_STOCK) · 재고 복구 (실제 백엔드는 상품의 재고 차감 연결 필요)',
  ],
  [
    '결제 시간 초과',
    paths.console.orders,
    '결제 이벤트가 오지 않으면 10분(설정값) 뒤 주문 취소(PAYMENT_EXPIRED). 짧게 보려면 백엔드 ORDER_PAYMENT_TIMEOUT(예: PT1M) · ORDER_PAYMENT_EXPIRY_INTERVAL을 줄인다',
  ],
]

const SCENARIO = [
  ['보호자', paths.console.childNew, '① 자녀 등록 (테스트 · 115cm · 보통 · 여유)'],
  ['보호자', paths.console.addresses, '① 배송지 등록'],
  ['판매자', paths.console.sellerProductNew, '② 상품 등록 → 판매 시작 (목)'],
  ['보호자', paths.console.products, '③ 자녀 맞춤 목록 → 상품 A 상세 → 추천 사이즈 120 (목)'],
  ['보호자', paths.console.cart, '④ 담기 → 주문하기 → 주문 상세에서 PAID 확인'],
  ['판매자', paths.console.sellerOrders, '⑤ 발송 → 배송 완료'],
  ['보호자', paths.console.orders, '⑥ 주문 상세에서 구매확정'],
  ['관리자', paths.console.adminSettlements, '⑦ 정산 실행 (목)'],
  ['판매자', paths.console.sellerSettlements, '⑦ 정산서 · 지급액 22,500원 확인 (목)'],
]

export function ConsoleHomePage() {
  const user = useSessionStore((state) => state.user)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kidly 시연"
        actions={<ResetDemoButton />}
        description="우리 아이에게 맞는 사이즈를 알려 주는 키즈 패션 마켓. 화면을 누르면 오른쪽에 호출한 API와 서버에서 이어지는 이벤트가 쌓여요."
      />
      <Card>
        <p className="mb-2 text-sm">
          {user
            ? `지금 ${user.nickname}(회원 ${user.memberId})로 로그인했어요.`
            : '위의 시연 역할 버튼으로 로그인하세요.'}
        </p>
        <ol className="space-y-1 text-sm">
          {SCENARIO.map(([role, to, label]) => (
            <li key={label}>
              <span className="text-muted-foreground inline-block w-14">{role}</span>
              <Link to={to} className="hover:text-primary underline-offset-2 hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <p className="mb-2 text-sm font-semibold">취소 · 실패 시나리오 (기획서 2.1)</p>
        <ul className="space-y-1 text-sm">
          {FAILURE_SCENARIOS.map(([name, to, how]) => (
            <li key={name}>
              <Link
                to={to}
                className="hover:text-primary font-medium underline-offset-2 hover:underline"
              >
                {name}
              </Link>
              <span className="text-muted-foreground"> — {how}</span>
            </li>
          ))}
        </ul>
        <Link
          to={paths.console.verify}
          className="text-primary mt-2 inline-block text-xs underline"
        >
          흐름 확인에서 판정 보기
        </Link>
        <Link
          to={paths.console.connect}
          className="text-primary mt-2 ml-3 inline-block text-xs underline"
        >
          백엔드 연결 점검
        </Link>
      </Card>
    </div>
  )
}
