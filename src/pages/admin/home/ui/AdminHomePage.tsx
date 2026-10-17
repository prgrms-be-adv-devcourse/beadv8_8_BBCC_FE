import { Link } from 'react-router'
import { useAdminMembersQuery } from '@/entities/member'
import { summarizeOrdersOn, useAdminOrdersQuery } from '@/entities/order'
import { useAdminPaymentsQuery } from '@/entities/payment'
import { useSellerApplicationsQuery } from '@/entities/seller'
import { paths } from '@/shared/config'
import { cn, formatWon, kstDateString } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'

type Tile = {
  to: string
  label: string
  value: string | number | undefined
  hint?: string
  tone?: 'warn'
}

/** 관리자 첫 화면: 오늘 숫자와 처리할 일 (이미 있는 목록 API로 계산) */
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

  const tiles: Tile[] = [
    { to: paths.admin.orders, label: '오늘 주문', value: summary?.count, hint: today },
    {
      to: `${paths.admin.orders}?status=PAID`,
      label: '오늘 결제된 금액',
      value: summary ? formatWon(summary.paidAmount) : undefined,
    },
    {
      to: `${paths.admin.orders}?status=CANCELLED`,
      label: '오늘 취소',
      value: summary?.cancelled,
    },
    {
      to: paths.admin.sellerApplications,
      label: '심사 대기 판매자 신청',
      value: pending,
      tone: pending ? 'warn' : undefined,
    },
    { to: paths.admin.members, label: '이용 정지 회원', value: suspended },
    { to: paths.admin.payments, label: '환불 있는 결제', value: refunds },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="대시보드"
        description="오늘 주문 · 결제와 처리할 일을 한눈에 봐요. 숫자를 누르면 그 목록으로 가요."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to}>
            <Card className="hover:border-primary h-full space-y-1 transition-colors">
              <p className="text-muted-foreground text-sm">{tile.label}</p>
              <p className={cn('text-3xl font-bold', tile.tone === 'warn' && 'text-amber-600')}>
                {tile.value ?? '…'}
              </p>
              {tile.hint && <p className="text-muted-foreground text-xs">{tile.hint}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
