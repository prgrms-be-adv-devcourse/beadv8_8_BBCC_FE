import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  CANCEL_REASON_LABEL,
  ORDER_STATUS_LABEL,
  OrderStatusBadge,
  useAdminOrdersQuery,
  type AdminOrder,
  type OrderStatus,
} from '@/entities/order'
import { PAYMENT_STATUS_LABEL, useAdminPaymentsQuery } from '@/entities/payment'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { DataTable, type DataColumn } from '@/shared/ui/DataTable'
import { DetailList } from '@/shared/ui/DetailList'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SideSheet } from '@/shared/ui/SideSheet'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]

const COLUMNS: DataColumn<AdminOrder>[] = [
  { key: 'id', header: '주문', cell: (o) => `주문 ${o.id}`, sortValue: (o) => Number(o.id) },
  {
    key: 'member',
    header: '회원',
    cell: (o) => `회원 ${o.memberId}`,
    sortValue: (o) => Number(o.memberId),
  },
  {
    key: 'items',
    header: '상품 수',
    cell: (o) => `${o.itemCount}개`,
    sortValue: (o) => o.itemCount,
  },
  {
    key: 'orderedAt',
    header: '주문 일시',
    cell: (o) => formatDateTime(o.orderedAt),
    sortValue: (o) => o.orderedAt,
  },
  {
    key: 'amount',
    header: '금액',
    cell: (o) => formatWon(o.totalAmount),
    sortValue: (o) => o.totalAmount,
    align: 'right',
  },
  {
    key: 'status',
    header: '상태',
    cell: (o) => <OrderStatusBadge status={o.status} />,
    sortValue: (o) => ORDER_STATUS_LABEL[o.status],
  },
  {
    key: 'cancel',
    header: '취소 사유',
    cell: (o) => (o.cancelReason ? CANCEL_REASON_LABEL[o.cancelReason] : ''),
    csvValue: (o) => (o.cancelReason ? CANCEL_REASON_LABEL[o.cancelReason] : ''),
  },
]

/** 관리자 전체 주문 (기획서 8장 보완): 상태 거르기 · 표 · 상세 서랍(결제 연결) · CSV */
export function AdminOrdersPage() {
  // 상태 거르기는 주소(?status=)에 둔다 → 대시보드에서 바로 열린다
  const [params, setParams] = useSearchParams()
  const raw = params.get('status')
  const status = STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : null
  const orders = useAdminOrdersQuery(status)
  const payments = useAdminPaymentsQuery()
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = orders.data?.content.find((order) => order.id === openId) ?? null
  const related = payments.data?.filter((payment) => payment.orderId === openId) ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        mockEndpoints={['GET /admin/orders']}
        title="전체 주문"
        description="모든 회원의 주문을 상태별로 봐요. 행을 누르면 결제까지 이어서 봐요."
        note="GET /admin/orders (BE #323). 최근 100건 안에서 화면이 상태로 거른다."
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={status === null ? 'default' : 'outline'}
          onClick={() => setParams({}, { replace: true })}
        >
          전체
        </Button>
        {STATUSES.map((key) => (
          <Button
            key={key}
            size="sm"
            variant={status === key ? 'default' : 'outline'}
            onClick={() => setParams({ status: key }, { replace: true })}
          >
            {ORDER_STATUS_LABEL[key]}
          </Button>
        ))}
      </div>
      {orders.isPending && <ListSkeleton />}
      {orders.isError && <StateMessage tone="error">{getErrorMessage(orders.error)}</StateMessage>}
      {orders.data && (
        <DataTable
          label="전체 주문"
          rows={orders.data.content}
          columns={COLUMNS}
          rowKey={(order) => order.id}
          onRowClick={(order) => setOpenId(order.id)}
          emptyText="주문이 없어요."
          csvFileName={`kidly-orders-${status ?? 'all'}`}
        />
      )}
      <SideSheet
        title={opened ? `주문 ${opened.id}` : '주문'}
        open={opened !== null}
        onClose={() => setOpenId(null)}
      >
        {opened && (
          <>
            <DetailList
              items={[
                { label: '상태', value: <OrderStatusBadge status={opened.status} /> },
                { label: '회원', value: `회원 ${opened.memberId}` },
                { label: '주문 일시', value: formatDateTime(opened.orderedAt) },
                { label: '상품 수', value: `${opened.itemCount}개` },
                { label: '금액', value: formatWon(opened.totalAmount) },
                ...(opened.cancelReason
                  ? [{ label: '취소 사유', value: CANCEL_REASON_LABEL[opened.cancelReason] }]
                  : []),
              ]}
            />
            <h3 className="font-semibold">이 주문의 결제</h3>
            {related.length === 0 ? (
              <StateMessage>결제 기록이 없어요 (결제 전에 취소됐거나 아직 처리 중).</StateMessage>
            ) : (
              related.map((payment) => (
                <DetailList
                  key={payment.id}
                  items={[
                    { label: '결제', value: `결제 ${payment.id}` },
                    { label: '상태', value: PAYMENT_STATUS_LABEL[payment.status] },
                    { label: '금액', value: formatWon(payment.amount) },
                    {
                      label: '일시',
                      value: formatDateTime(payment.paidAt ?? payment.createdAt),
                    },
                    ...(payment.refundedAmount > 0
                      ? [{ label: '환불', value: formatWon(payment.refundedAmount) }]
                      : []),
                  ]}
                />
              ))
            )}
          </>
        )}
      </SideSheet>
    </div>
  )
}
