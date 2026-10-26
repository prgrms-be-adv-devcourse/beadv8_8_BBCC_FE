import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAdminMembersQuery } from '@/entities/member'
import { summarizeOrdersOn, useAdminOrdersQuery } from '@/entities/order'
import { useAdminPaymentsQuery } from '@/entities/payment'
import { useSellerApplicationsQuery } from '@/entities/seller'
import { paths } from '@/shared/config'
import { cn, formatWon, kstDateString } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'

/**
 * 관리자 첫 화면: 처리할 일(심사 대기 판매자 신청)을 가장 크게 두고,
 * 나머지 수치는 거래 · 회원 묶음으로 실선 사이에 둔다 (이미 있는 목록 API로 계산).
 * 누르면 그 목록으로 (주소 ?status=)
 */
export function AdminHomePage() {
  const orders = useAdminOrdersQuery(null)
  const payments = useAdminPaymentsQuery()
  const applications = useSellerApplicationsQuery(null)
  const members = useAdminMembersQuery('ALL', '')
  const today = kstDateString()
  const summary = orders.data ? summarizeOrdersOn(orders.data.content, today) : null
  const pending = applications.data?.content.filter((item) => item.status === 'PENDING').length
  const suspended = members.data?.content.filter((member) => member.status === 'SUSPENDED').length
  const refunds = payments.data?.filter((payment) => payment.refundedAmount > 0).length

  return (
    <div className="shop-look space-y-8">
      <PageHeader
        title="대시보드"
        description="오늘 거래와 처리할 일을 봐요. 숫자를 누르면 그 목록으로 가요."
      />

      <section aria-label="처리할 일" className="space-y-4">
        <h2 className="text-section">처리할 일</h2>

        {/* 시그니처: 심사 대기 판매자 신청 */}
        <Link
          to={paths.admin.sellerApplications}
          className="border-rule hover:border-ink-3 flex items-end justify-between gap-6 rounded-lg border p-5 transition-colors md:p-6"
        >
          <span className="text-ink text-[15px] font-bold">심사 대기 판매자 신청</span>
          <span
            className={cn(
              'figure text-5xl leading-none font-bold tracking-tight',
              pending ? 'text-signal' : 'text-ink-3',
            )}
          >
            {pending ?? '…'}
          </span>
        </Link>

        <div className="border-rule divide-rule grid divide-y border-y md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:divide-x md:divide-y-0">
          <MetricGroup title="거래" aside={today}>
            <Metric to={paths.admin.orders} label="오늘 주문" value={summary?.count} />
            <Metric
              to={`${paths.admin.orders}?status=PAID`}
              label="오늘 결제된 금액"
              value={summary ? formatWon(summary.paidAmount) : undefined}
            />
            <Metric
              to={`${paths.admin.orders}?status=CANCELLED`}
              label="오늘 취소"
              value={summary?.cancelled}
            />
            <Metric to={paths.admin.payments} label="환불 있는 결제" value={refunds} />
          </MetricGroup>
          <MetricGroup title="회원">
            <Metric
              to={`${paths.admin.members}?filter=SUSPENDED`}
              label="이용 정지 회원"
              value={suspended}
            />
          </MetricGroup>
        </div>
      </section>
    </div>
  )
}

type MetricGroupProps = { title: string; aside?: string; children: ReactNode }

/** 관심사 묶음 하나 (거래 · 회원). aside는 제목 오른쪽 작은 글자 (예: 오늘 날짜) */
function MetricGroup({ title, aside, children }: MetricGroupProps) {
  return (
    <div className="space-y-2 py-4 md:px-5 md:first:pl-0 md:last:pr-0">
      <h3 className="text-ink-3 flex items-baseline justify-between gap-3 text-[13px] font-semibold">
        {title}
        {aside && <span className="figure font-medium">{aside}</span>}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>
    </div>
  )
}

type MetricProps = {
  to: string
  label: string
  /** 아직 불러오지 못했으면 undefined (「…」) */
  value: number | string | undefined
}

/** 수치 하나: 라벨 · 값, 누르면 그 목록으로. 0이면 흐리게 */
function Metric({ to, label, value }: MetricProps) {
  const isEmpty = value === undefined || value === 0
  return (
    <Link
      to={to}
      className="hover:bg-paper-2 -mx-2 flex min-h-11 flex-col justify-center rounded-md px-2 py-1.5 transition-colors"
    >
      <span className="text-ink-2 text-[13px]">{label}</span>
      <span className={cn('figure text-xl font-bold', isEmpty ? 'text-ink-3' : 'text-ink')}>
        {value ?? '…'}
      </span>
    </Link>
  )
}
