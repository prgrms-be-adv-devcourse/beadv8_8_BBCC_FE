import {
  PAYMENT_STATUS_LABEL,
  paymentIssueNote,
  useAdminPaymentsQuery,
  type AdminPayment,
} from '@/entities/payment'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { downloadCsv, formatDateTime, toCsv, useArea, type CsvColumn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { AdminPaymentTable } from './AdminPaymentTable'

const CSV_COLUMNS: CsvColumn<AdminPayment>[] = [
  { header: '결제', value: (p) => p.id },
  { header: '주문', value: (p) => p.orderId },
  { header: '회원', value: (p) => p.memberId },
  { header: '일시', value: (p) => formatDateTime(p.paidAt ?? p.createdAt) },
  { header: '금액', value: (p) => p.amount },
  { header: '상태', value: (p) => PAYMENT_STATUS_LABEL[p.status] },
  { header: '실패 · 환불', value: paymentIssueNote },
]

/** 관리자 전체 결제 · 환불 (기획서 8장 보완): 결제 표 → 결제를 누르면 결제 상세 */
export function AdminPaymentsPage() {
  const adminPaths = adminPathsOf(useArea())
  const payments = useAdminPaymentsQuery()
  const rows = payments.data ?? []

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        mockEndpoints={['GET /admin/payments']}
        title="전체 결제 · 환불"
        description="모든 회원의 주문 결제 · 환불 기록을 봐요. 결제를 누르면 주문까지 이어서 봐요."
        note="GET /admin/payments (BE #326)."
      />
      {payments.isPending && <ListSkeleton />}
      {payments.isError && (
        <StateMessage tone="error">{getErrorMessage(payments.error)}</StateMessage>
      )}
      {payments.data && (
        <section aria-label="결제 목록" className="space-y-2">
          <div className="text-ink-3 flex min-h-11 items-center justify-between text-[13px]">
            <span className="figure">{rows.length}건</span>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() => downloadCsv('kidly-payments', toCsv(rows, CSV_COLUMNS))}
                className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center font-semibold underline underline-offset-4 transition-colors lg:min-h-8"
              >
                CSV 내려받기
              </button>
            )}
          </div>
          {rows.length === 0 ? (
            <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
              결제 기록이 없어요.
            </p>
          ) : (
            <AdminPaymentTable
              payments={rows}
              paymentHref={adminPaths.payment}
              orderHref={adminPaths.order}
              memberHref={adminPaths.member}
            />
          )}
        </section>
      )}
    </div>
  )
}
