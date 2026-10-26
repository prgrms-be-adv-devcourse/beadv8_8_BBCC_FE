import { Link } from 'react-router'
import { useAddressesQuery } from '@/entities/address'
import { sizeBandOf, useChildrenQuery } from '@/entities/child'
import { countOrdersByTab, ORDER_TABS, useOrdersQuery } from '@/entities/order'
import { PAYMENT_STATUS_LABEL, usePaymentsQuery } from '@/entities/payment'
import { hasRole, ROLE_LABEL, useSessionStore } from '@/entities/session'
import { useWalletQuery } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatDateTime, formatWon } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 마이페이지 홈: 나와 자산(예치금 · 자녀 · 배송지) → 주문 상태 → 우리 아이 → 최근 결제.
 * 관심사별 메뉴는 마이페이지 레이아웃(MyPageMenu)이 왼쪽에 둔다
 */
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

  const counts = countOrdersByTab(orders.data?.content ?? [])
  return (
    <div className="shop-look space-y-10">
      <h1 className="sr-only">마이페이지</h1>
      {/* 나와 자산 */}
      <section aria-label="내 정보 요약" className="border-rule rounded-xl border">
        <div className="flex flex-wrap items-center gap-4 p-5 md:p-6">
          <span
            aria-hidden
            className="bg-signal-soft text-signal flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
          >
            {user.nickname.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-ink truncate text-xl font-bold">{user.nickname}님</p>
            <p className="flex flex-wrap items-center gap-1.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="bg-paper-2 text-ink-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold"
                >
                  {ROLE_LABEL[role]}
                </span>
              ))}
              <span className="text-ink-3 figure text-xs">회원 {user.memberId}</span>
            </p>
          </div>
          <Link
            to={paths.shop.profile}
            className="border-rule text-ink-2 hover:border-field-edge inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors"
          >
            내 정보 수정
          </Link>
        </div>
        <div className="border-rule divide-rule grid grid-cols-3 divide-x border-t">
          <AssetCell
            label="예치금"
            value={wallet.data ? formatWon(wallet.data.balance) : '…'}
            to={paths.shop.wallet}
            action="충전"
          />
          <AssetCell
            label="자녀"
            value={children.data ? `${children.data.length}명` : '…'}
            to={paths.shop.children}
          />
          <AssetCell
            label="배송지"
            value={addresses.data ? `${addresses.data.length}곳` : '…'}
            to={paths.shop.addresses}
          />
        </div>
      </section>

      {/* 주문 상태 */}
      <section aria-label="주문 상태 요약" className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-section">주문 상태</h2>
          <Link
            to={paths.shop.orders}
            className="text-ink-3 hover:text-ink text-[13px] font-semibold"
          >
            전체 보기
          </Link>
        </div>
        <div className="bg-paper-2 grid grid-cols-4 rounded-xl py-5">
          {ORDER_TABS.map((tab) => (
            <Link
              key={tab.value}
              to={tab.value === 'ALL' ? paths.shop.orders : `${paths.shop.orders}?tab=${tab.value}`}
              className="group space-y-1 px-2 text-center"
            >
              <p
                className={cn(
                  'figure text-2xl font-bold transition-colors',
                  orders.data && counts[tab.value] > 0 ? 'text-ink' : 'text-ink-3',
                  'group-hover:text-signal',
                )}
              >
                {orders.data ? counts[tab.value] : '…'}
              </p>
              <p className="text-ink-2 text-xs">{tab.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 우리 아이: 키 · 추천 사이즈 */}
      {isBuyer && (
        <section aria-label="우리 아이" className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-section">우리 아이</h2>
            <Link
              to={paths.shop.children}
              className="text-ink-3 hover:text-ink text-[13px] font-semibold"
            >
              자녀 프로필
            </Link>
          </div>
          {children.isError && (
            <StateMessage tone="error">{getErrorMessage(children.error)}</StateMessage>
          )}
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {children.data?.map((child) => (
              <li key={child.id}>
                <Link
                  to={paths.shop.child(child.id)}
                  className="border-rule hover:border-ink-3 flex h-full items-center gap-3 rounded-lg border p-3.5 transition-colors"
                >
                  <span
                    aria-hidden
                    className="bg-signal-soft text-signal flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
                  >
                    {child.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 space-y-0.5">
                    <span className="text-ink block truncate text-sm font-bold">{child.name}</span>
                    <span className="text-ink-3 block text-xs">
                      <span className="figure">{child.heightCm}cm</span>, 사이즈{' '}
                      <strong className="text-fit-ink figure">
                        {sizeBandOf(child.heightCm).size}
                      </strong>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={paths.shop.childNew}
                className="border-rule text-ink-2 hover:border-ink-3 hover:text-ink flex h-full min-h-[4.25rem] items-center justify-center gap-1 rounded-lg border border-dashed text-sm font-semibold transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                자녀 추가
              </Link>
            </li>
          </ul>
        </section>
      )}

      {/* 최근 결제 */}
      <section aria-label="최근 결제 내역" className="space-y-3">
        <h2 className="text-section">최근 결제 내역</h2>
        {payments.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {payments.isError && (
          <StateMessage tone="error">{getErrorMessage(payments.error)}</StateMessage>
        )}
        {payments.data?.length === 0 && <StateMessage>결제한 주문이 없어요.</StateMessage>}
        {payments.data && payments.data.length > 0 && (
          <ul className="divide-rule border-rule divide-y border-y">
            {payments.data.slice(0, 5).map((payment) => (
              <li key={payment.id}>
                <Link
                  to={paths.shop.order(payment.orderId)}
                  className="hover:bg-paper-2 -mx-3 flex items-center justify-between gap-4 rounded-md px-3 py-3.5 transition-colors"
                >
                  <span className="min-w-0 space-y-0.5">
                    <span className="text-ink block text-sm font-semibold">
                      주문번호 {payment.orderId}
                    </span>
                    <span className="text-ink-3 figure block text-xs">
                      {formatDateTime(payment.paidAt ?? payment.createdAt)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        payment.status === 'COMPLETED' ? 'text-signal' : 'text-ink-3',
                      )}
                    >
                      {PAYMENT_STATUS_LABEL[payment.status]}
                    </span>
                    <span className="figure text-[15px] font-bold">
                      {formatWon(payment.amount)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

type AssetCellProps = {
  label: string
  value: string
  to: string
  /** 오른쪽 작은 동작 글자 (예: 충전) */
  action?: string
}

/** 나와 자산 아래 칸 하나: 이름 · 값, 누르면 그 화면으로 */
function AssetCell({ label, value, to, action }: AssetCellProps) {
  return (
    <Link to={to} className="hover:bg-paper-2 block px-4 py-4 transition-colors md:px-6">
      <span className="text-ink-3 flex items-center justify-between gap-2 text-[13px]">
        {label}
        {action && <span className="text-signal text-xs font-semibold">{action}</span>}
      </span>
      <span className="figure text-ink mt-1 block truncate text-lg font-bold">{value}</span>
    </Link>
  )
}
