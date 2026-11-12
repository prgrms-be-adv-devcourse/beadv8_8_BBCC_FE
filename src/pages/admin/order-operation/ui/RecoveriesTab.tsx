import { useState } from 'react'
import { Link } from 'react-router'
import {
  canRetryFailure,
  failureStatusLabel,
  usePaymentRecoveriesQuery,
} from '@/entities/order-operation'
import { OrderFailureActionButton } from '@/features/handle-order-failure'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { formatDateTime, formatWon, useArea } from '@/shared/lib'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { FailureList } from './FailureList'

/** 결제 완료 반영 실패: 예치금은 빠졌는데 주문에 결제 완료가 반영되지 않은 기록 → 재처리 또는 주문 취소(환불) */
export function RecoveriesTab() {
  const adminPaths = adminPathsOf(useArea())
  const [isPendingOnly, setPendingOnly] = useState(true)
  const [page, setPage] = useState(0)
  const recoveries = usePaymentRecoveriesQuery(isPendingOnly ? 'PENDING' : null, page)
  const rows = recoveries.data?.content ?? []
  return (
    <div className="space-y-3">
      <p className="text-ink-2 text-sm">
        예치금은 빠졌는데 주문에 결제 완료가 반영되지 않았어요. 원인을 고친 뒤 다시 처리하거나,
        주문을 취소해 돌려줘요.
      </p>
      {recoveries.isPending && <ListSkeleton />}
      {recoveries.isError && (
        <StateMessage tone="error">{getErrorMessage(recoveries.error)}</StateMessage>
      )}
      {recoveries.data && (
        <FailureList
          pendingOnly={{
            value: isPendingOnly,
            onChange: (value) => {
              setPendingOnly(value)
              setPage(0)
            },
          }}
          total={recoveries.data.totalElements}
          emptyText="처리를 기다리는 결제 반영 실패가 없어요."
          isEmpty={rows.length === 0}
        >
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-rule flex flex-wrap items-start gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="flex flex-wrap gap-x-3">
                  <Link
                    to={adminPaths.order(row.orderId)}
                    className="font-semibold hover:underline"
                  >
                    주문 #{row.orderId}
                  </Link>
                  <span className="figure">{formatWon(row.amount)}</span>
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
                    action="retryRecovery"
                    id={row.id}
                    label="다시 처리"
                    confirm={{
                      title: '결제 완료 반영을 다시 할까요?',
                      description: '보관한 결제 완료로 주문에 다시 반영해요.',
                      confirmLabel: '다시 처리',
                    }}
                  />
                  <OrderFailureActionButton
                    action="cancelRecovery"
                    id={row.id}
                    label="주문 취소"
                    variant="destructive"
                    confirm={{
                      title: '주문을 취소하고 끝낼까요?',
                      description:
                        '주문을 취소해 예치금을 돌려주고 재고를 되돌려요. 되돌릴 수 없어요.',
                      confirmLabel: '주문 취소',
                      tone: 'danger',
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </FailureList>
      )}
      {recoveries.data && (
        <Pagination
          page={recoveries.data.page}
          totalPages={recoveries.data.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  )
}
