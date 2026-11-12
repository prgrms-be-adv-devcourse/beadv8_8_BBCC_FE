import { useState } from 'react'
import { Link } from 'react-router'
import {
  canRetryFailure,
  eventTypeLabel,
  failureStatusLabel,
  useEventFailuresQuery,
} from '@/entities/order-operation'
import { OrderFailureActionButton } from '@/features/handle-order-failure'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { formatDateTime, useArea } from '@/shared/lib'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { FailureList } from './FailureList'

/** 받은 이벤트 처리 실패: 재고 · 결제 이벤트를 주문이 처리하지 못한 기록 → 재처리 또는 기록 종료(주문은 그대로) */
export function EventFailuresTab() {
  const adminPaths = adminPathsOf(useArea())
  const [isPendingOnly, setPendingOnly] = useState(true)
  const [page, setPage] = useState(0)
  const failures = useEventFailuresQuery(isPendingOnly ? 'PENDING' : null, page)
  const rows = failures.data?.content ?? []
  return (
    <div className="space-y-3">
      <p className="text-ink-2 text-sm">
        주문이 받은 재고 · 결제 이벤트를 처리하지 못했어요. 원인을 고친 뒤 다시 처리하거나, 처리할
        필요가 없으면 기록을 끝내요.
      </p>
      {failures.isPending && <ListSkeleton />}
      {failures.isError && (
        <StateMessage tone="error">{getErrorMessage(failures.error)}</StateMessage>
      )}
      {failures.data && (
        <FailureList
          pendingOnly={{
            value: isPendingOnly,
            onChange: (value) => {
              setPendingOnly(value)
              setPage(0)
            },
          }}
          total={failures.data.totalElements}
          emptyText="처리를 기다리는 이벤트 처리 실패가 없어요."
          isEmpty={rows.length === 0}
        >
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-rule flex flex-wrap items-start gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="flex flex-wrap gap-x-3">
                  {row.orderId ? (
                    <Link
                      to={adminPaths.order(row.orderId)}
                      className="font-semibold hover:underline"
                    >
                      주문 #{row.orderId}
                    </Link>
                  ) : (
                    <span className="font-semibold">주문 없음</span>
                  )}
                  <span>{eventTypeLabel(row.eventType)}</span>
                  {row.stockFailureCount > 0 && (
                    <span className="text-ink-3">재고 실패 {row.stockFailureCount}건</span>
                  )}
                  <span className="text-ink-3">{failureStatusLabel(row.status)}</span>
                </p>
                <p className="text-ink-3 text-[13px]">
                  {row.failureCode ? `오류 ${row.failureCode}` : '오류 기록 없음'} · 시도{' '}
                  {row.attemptCount}번 · {formatDateTime(row.lastAttemptedAt ?? row.createdAt)}
                </p>
              </div>
              {canRetryFailure(row) && (
                <div className="flex gap-2">
                  <OrderFailureActionButton
                    action="retryEventFailure"
                    id={row.id}
                    label="다시 처리"
                    confirm={{
                      title: '이벤트를 다시 처리할까요?',
                      description: '보관한 이벤트 데이터로 주문에 다시 반영해요.',
                      confirmLabel: '다시 처리',
                    }}
                  />
                  <OrderFailureActionButton
                    action="cancelEventFailure"
                    id={row.id}
                    label="기록 끝내기"
                    confirm={{
                      title: '이 기록을 끝낼까요?',
                      description: '주문은 바꾸지 않고 기록만 끝내요. 다시 처리할 수 없어요.',
                      confirmLabel: '끝내기',
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </FailureList>
      )}
      {failures.data && (
        <Pagination
          page={failures.data.page}
          totalPages={failures.data.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  )
}
