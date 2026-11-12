import { useState } from 'react'
import { Link } from 'react-router'
import { eventTypeLabel, useQuarantinedOutboxQuery } from '@/entities/order-operation'
import { OrderFailureActionButton } from '@/features/handle-order-failure'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { formatDateTime, useArea } from '@/shared/lib'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { FailureList } from './FailureList'

/** 격리된 이벤트: 주문이 여러 번 보내지 못해 멈춘 아웃박스 메시지 → 원인을 고친 뒤 다시 보내기 */
export function OutboxTab() {
  const adminPaths = adminPathsOf(useArea())
  const [page, setPage] = useState(0)
  const outbox = useQuarantinedOutboxQuery(page)
  const rows = outbox.data?.content ?? []
  return (
    <div className="space-y-3">
      <p className="text-ink-2 text-sm">
        주문이 다른 도메인에 보내지 못해 격리한 이벤트예요. 뒤의 이벤트도 함께 멈추니, 원인을 고친
        뒤 다시 보내요.
      </p>
      {outbox.isPending && <ListSkeleton />}
      {outbox.isError && <StateMessage tone="error">{getErrorMessage(outbox.error)}</StateMessage>}
      {outbox.data && (
        <FailureList
          total={outbox.data.totalElements}
          emptyText="격리된 이벤트가 없어요."
          isEmpty={rows.length === 0}
        >
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-rule flex flex-wrap items-start gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="flex flex-wrap gap-x-3">
                  <span className="font-semibold">{eventTypeLabel(row.eventType)}</span>
                  {row.orderId && (
                    <Link to={adminPaths.order(row.orderId)} className="hover:underline">
                      주문 #{row.orderId}
                    </Link>
                  )}
                </p>
                <p className="text-ink-3 text-[13px]">
                  {row.lastError ? `오류 ${row.lastError}` : '오류 기록 없음'} · 시도{' '}
                  {row.attemptCount}번 · {formatDateTime(row.quarantinedAt)} 격리
                  {row.retryCount > 0 && ` · 다시 보내기 ${row.retryCount}번`}
                </p>
              </div>
              <OrderFailureActionButton
                action="retryOutbox"
                id={row.id}
                label="다시 보내기"
                confirm={{
                  title: '이 이벤트를 다시 보낼까요?',
                  description: '원인을 고쳤을 때만 보내요. 보내기 대기열에 다시 넣어요.',
                  confirmLabel: '다시 보내기',
                }}
              />
            </li>
          ))}
        </FailureList>
      )}
      {outbox.data && (
        <Pagination
          page={outbox.data.page}
          totalPages={outbox.data.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  )
}
