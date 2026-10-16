import { useState } from 'react'
import { CANCEL_REASON_LABEL, OrderStatusBadge, useAdminOrdersQuery } from '@/entities/order'
import {
  PAYMENT_FAILURE_LABEL,
  PAYMENT_STATUS_LABEL,
  useAdminPaymentsQuery,
  type AdminPayment,
} from '@/entities/payment'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { DataTable, type DataColumn } from '@/shared/ui/DataTable'
import { DetailList } from '@/shared/ui/DetailList'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SideSheet } from '@/shared/ui/SideSheet'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

const note = (p: AdminPayment) =>
  [
    p.failureCode && PAYMENT_FAILURE_LABEL[p.failureCode],
    p.refundedAmount > 0 && `환불 ${formatWon(p.refundedAmount)}`,
  ]
    .filter(Boolean)
    .join(' · ')

const COLUMNS: DataColumn<AdminPayment>[] = [
  { key: 'id', header: '결제', cell: (p) => `결제 ${p.id}`, sortValue: (p) => Number(p.id) },
  {
    key: 'order',
    header: '주문',
    cell: (p) => `주문 ${p.orderId}`,
    sortValue: (p) => Number(p.orderId),
  },
  {
    key: 'member',
    header: '회원',
    cell: (p) => `회원 ${p.memberId}`,
    sortValue: (p) => Number(p.memberId),
  },
  {
    key: 'at',
    header: '일시',
    cell: (p) => formatDateTime(p.paidAt ?? p.createdAt),
    sortValue: (p) => p.paidAt ?? p.createdAt,
  },
  {
    key: 'amount',
    header: '금액',
    cell: (p) => formatWon(p.amount),
    sortValue: (p) => p.amount,
    align: 'right',
  },
  {
    key: 'status',
    header: '상태',
    cell: (p) => (
      <Badge variant={p.status === 'COMPLETED' ? 'success' : 'muted'}>
        {PAYMENT_STATUS_LABEL[p.status]}
      </Badge>
    ),
    sortValue: (p) => PAYMENT_STATUS_LABEL[p.status],
  },
  { key: 'note', header: '실패 · 환불', cell: note, csvValue: note },
]

/** 관리자 전체 결제 · 환불 (기획서 8장 보완): 표 · 상세 서랍(주문 연결) · CSV */
export function AdminPaymentsPage() {
  const payments = useAdminPaymentsQuery()
  const orders = useAdminOrdersQuery(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = payments.data?.find((payment) => payment.id === openId) ?? null
  const order = orders.data?.content.find((item) => item.id === opened?.orderId) ?? null

  return (
    <div className="space-y-4">
      <PageHeader
        mockEndpoints={['GET /admin/payments']}
        title="전체 결제 · 환불"
        description="모든 회원의 주문 결제 · 환불 기록을 봐요. 행을 누르면 주문까지 이어서 봐요."
        note="GET /admin/payments (BE #326)."
      />
      {payments.isPending && <ListSkeleton />}
      {payments.isError && (
        <StateMessage tone="error">{getErrorMessage(payments.error)}</StateMessage>
      )}
      {payments.data && (
        <DataTable
          label="전체 결제"
          rows={payments.data}
          columns={COLUMNS}
          rowKey={(payment) => payment.id}
          onRowClick={(payment) => setOpenId(payment.id)}
          emptyText="결제 기록이 없어요."
          csvFileName="kidly-payments"
        />
      )}
      <SideSheet
        title={opened ? `결제 ${opened.id}` : '결제'}
        open={opened !== null}
        onClose={() => setOpenId(null)}
      >
        {opened && (
          <>
            <DetailList
              items={[
                { label: '상태', value: PAYMENT_STATUS_LABEL[opened.status] },
                { label: '회원', value: `회원 ${opened.memberId}` },
                { label: '금액', value: formatWon(opened.amount) },
                { label: '결제 일시', value: formatDateTime(opened.paidAt) },
                { label: '만든 일시', value: formatDateTime(opened.createdAt) },
                ...(note(opened) ? [{ label: '실패 · 환불', value: note(opened) }] : []),
              ]}
            />
            <h3 className="font-semibold">결제한 주문</h3>
            {order ? (
              <DetailList
                items={[
                  { label: '주문', value: `주문 ${order.id}` },
                  { label: '상태', value: <OrderStatusBadge status={order.status} /> },
                  { label: '주문 일시', value: formatDateTime(order.orderedAt) },
                  { label: '상품 수', value: `${order.itemCount}개` },
                  { label: '금액', value: formatWon(order.totalAmount) },
                  ...(order.cancelReason
                    ? [{ label: '취소 사유', value: CANCEL_REASON_LABEL[order.cancelReason] }]
                    : []),
                ]}
              />
            ) : (
              <StateMessage>주문 {opened.orderId} (최근 주문 목록에 없어요)</StateMessage>
            )}
          </>
        )}
      </SideSheet>
    </div>
  )
}
