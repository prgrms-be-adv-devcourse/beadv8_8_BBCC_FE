import { Link } from 'react-router'
import { useSessionStore } from '@/entities/session'
import { paths } from '@/shared/config'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'

const SCENARIO = [
  ['보호자', paths.console.children, '① 자녀 등록 (테스트 · 115cm · 보통 · 여유)'],
  ['보호자', paths.console.addresses, '① 배송지 등록'],
  ['판매자', paths.console.sellerProducts, '② 상품 등록 → 판매 시작 (목)'],
  ['보호자', paths.console.products, '③ 자녀 맞춤 목록 → 상품 A 상세 → 추천 사이즈 120 (목)'],
  ['보호자', paths.console.cart, '④ 담기 → 주문하기 → 주문 상세에서 PAID 확인'],
  ['판매자', paths.console.sellerOrders, '⑤ 발송 → 배송 완료'],
  ['보호자', paths.console.orders, '⑥ 주문 상세에서 구매확정'],
  ['관리자', paths.console.adminSettlements, '⑦ 정산 실행 (목)'],
  ['판매자', paths.console.sellerSettlements, '⑦ 정산서 · 지급액 22,500원 확인 (목)'],
]

export function HomePage() {
  const user = useSessionStore((state) => state.user)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kidly 시연"
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
    </div>
  )
}
