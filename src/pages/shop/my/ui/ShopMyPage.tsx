import { Link } from 'react-router'
import { useAddressesQuery } from '@/entities/address'
import { useChildrenQuery } from '@/entities/child'
import { countOrdersByTab, ORDER_TABS, useOrdersQuery } from '@/entities/order'
import { PaymentRow, usePaymentsQuery } from '@/entities/payment'
import { describeUser, hasRole, useSessionStore } from '@/entities/session'
import { useWalletQuery } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 마이페이지: 자녀 · 배송지 · 예치금 요약과 바로가기 */
export function ShopMyPage() {
  const user = useSessionStore((state) => state.user)
  const isBuyer = hasRole(user, 'BUYER')
  const children = useChildrenQuery({ enabled: isBuyer })
  const addresses = useAddressesQuery()
  const wallet = useWalletQuery()
  const payments = usePaymentsQuery({ enabled: Boolean(user) })
  const orders = useOrdersQuery()

  if (!user) {
    return (
      <StateMessage>
        <Link to={paths.login} className="text-primary underline">
          로그인
        </Link>
        하면 마이페이지를 볼 수 있어요.
      </StateMessage>
    )
  }

  const tiles = [
    {
      to: paths.shop.children,
      title: '자녀 프로필',
      value: children.data ? `${children.data.length}명` : '…',
      hint: children.data?.map((child) => `${child.name} ${child.heightCm}cm`).join(', '),
    },
    {
      to: paths.shop.addresses,
      title: '배송지',
      value: addresses.data ? `${addresses.data.length}곳` : '…',
      hint: addresses.data?.find((item) => item.isDefault)?.roadAddress,
    },
    {
      to: paths.shop.wallet,
      title: '예치금',
      value: wallet.data ? formatWon(wallet.data.balance) : '…',
      hint: '충전 · 충전 취소',
    },
    { to: paths.shop.orders, title: '주문 내역', value: '보기', hint: '배송 조회 · 구매확정' },
    { to: paths.shop.profile, title: '내 정보', value: user.nickname, hint: '닉네임 수정 · 탈퇴' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="text-muted-foreground text-sm">{describeUser(user)}</p>
      </div>
      <section aria-label="주문 상태 요약" className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">주문 상태</h2>
          <Link to={paths.shop.orders} className="text-muted-foreground text-xs underline">
            전체 보기
          </Link>
        </div>
        <div className="grid grid-cols-4 divide-x text-center">
          {ORDER_TABS.map((tab) => {
            const counts = countOrdersByTab(orders.data?.content ?? [])
            return (
              <Link
                key={tab.value}
                to={
                  tab.value === 'ALL' ? paths.shop.orders : `${paths.shop.orders}?tab=${tab.value}`
                }
                className="hover:text-primary space-y-1 px-2"
              >
                <p className="text-2xl font-extrabold">{orders.data ? counts[tab.value] : '…'}</p>
                <p className="text-muted-foreground text-xs">{tab.label}</p>
              </Link>
            )
          })}
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.to} to={tile.to}>
            <Card className="hover:border-primary h-full space-y-1 transition-colors">
              <p className="text-muted-foreground text-sm">{tile.title}</p>
              <p className="text-xl font-bold">{tile.value}</p>
              {tile.hint && <p className="text-muted-foreground truncate text-xs">{tile.hint}</p>}
            </Card>
          </Link>
        ))}
      </div>
      <Card className="space-y-2">
        <CardTitle>최근 결제 내역</CardTitle>
        {payments.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {payments.isError && (
          <StateMessage tone="error">{getErrorMessage(payments.error)}</StateMessage>
        )}
        {payments.data?.length === 0 && <StateMessage>결제한 주문이 없어요.</StateMessage>}
        {payments.data?.slice(0, 5).map((payment) => (
          <PaymentRow key={payment.id} payment={payment} />
        ))}
      </Card>
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-semibold">아동복을 팔고 싶다면</p>
          <p className="text-muted-foreground text-sm">판매자로 신청하고 관리자 승인을 받으세요.</p>
        </div>
        <Link
          to={hasRole(user, 'SELLER') ? paths.center.home : paths.center.apply}
          className="text-primary text-sm underline"
        >
          {hasRole(user, 'SELLER') ? '판매자 센터로' : '판매자 신청'}
        </Link>
      </Card>
    </div>
  )
}
