import { Link, useLocation } from 'react-router'
import { ORDER_DEAD_LETTER_STATUS_LABEL, useOrderDeadLetterQuery } from '@/entities/dead-letter'
import { ORDER_STATUS_LABEL } from '@/entities/order'
import { OrderDeadLetterActions } from '@/features/handle-order-dead-letter'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatDateTime, labelOf } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { InfoRow } from './InfoRow'
import { None } from './None'
import { NotFound } from './NotFound'
import { Position } from './Position'

type OrderDeadLetterDetailProps = { deadLetterId: string }

/** 주문 처리 실패 메시지 상세: 지금 상태 · 권장 조치 · 재처리 / 확인 후 종료 → 메시지 · 실패 정보 → 본문 → 처리 기록 */
export function OrderDeadLetterDetail({ deadLetterId }: OrderDeadLetterDetailProps) {
  const listSearch =
    (useLocation().state as { listSearch?: string } | null)?.listSearch ?? 'module=order'
  const query = useOrderDeadLetterQuery(deadLetterId)
  const deadLetter = query.data

  return (
    <div className="shop-look max-w-3xl space-y-6">
      <Link
        to={{ pathname: paths.admin.deadLetters, search: listSearch }}
        className="text-ink-3 hover:text-ink inline-flex min-h-8 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        처리 실패 메시지
      </Link>
      <PageHeader
        title={`메시지 ${deadLetterId}`}
        description="주문 서비스가 처리하지 못한 메시지예요."
        note="GET /admin/orders/dead-letters/{id} (BE #601). 재처리 POST …/reprocess(실패해도 200 · OPEN 유지, 종료됐으면 409), 확인 후 종료 POST …/close { memo }(재처리됐으면 409)."
      />
      {query.isPending && <ListSkeleton rows={2} />}
      {query.isError &&
        (getErrorStatus(query.error) === 404 ? (
          <NotFound />
        ) : (
          <StateMessage tone="error">{getErrorMessage(query.error)}</StateMessage>
        ))}
      {deadLetter && (
        <>
          <section aria-label="처리 상태" className="border-rule space-y-3 rounded-lg border p-5">
            <h2 className={cn('text-page', deadLetter.status === 'OPEN' && 'text-destructive')}>
              {ORDER_DEAD_LETTER_STATUS_LABEL[deadLetter.status]}
            </h2>
            {deadLetter.isPaymentEvent && (
              <p className="text-destructive text-sm font-semibold">
                결제에서 온 메시지예요. 돈이 걸려 있어 먼저 확인해 주세요.
              </p>
            )}
            {deadLetter.recommendedAction && (
              <p className="text-ink-2 text-sm">권장 조치: {deadLetter.recommendedAction}</p>
            )}
            <OrderDeadLetterActions key={deadLetter.id} deadLetter={deadLetter} />
          </section>

          <section aria-label="메시지 정보" className="space-y-3">
            <h2 className="text-section">메시지 정보</h2>
            <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
              <InfoRow label="처음 받은 시각">
                <span className="figure">{formatDateTime(deadLetter.firstReceivedAt)}</span>
              </InfoRow>
              <InfoRow label="마지막 받은 시각">
                <span className="figure">{formatDateTime(deadLetter.lastReceivedAt)}</span>
              </InfoRow>
              <InfoRow label="받은 횟수">
                <span className="figure">{deadLetter.receivedCount}회</span>
              </InfoRow>
              <InfoRow label="관련 주문">
                {deadLetter.orderId ? (
                  <span>
                    <Link
                      to={paths.admin.order(deadLetter.orderId)}
                      className="shop-link figure"
                    >{`주문 ${deadLetter.orderId}`}</Link>
                    {deadLetter.orderStatus && (
                      <span className="text-ink-2 ml-2 font-normal">
                        지금 {labelOf(ORDER_STATUS_LABEL, deadLetter.orderStatus)}
                      </span>
                    )}
                  </span>
                ) : (
                  <None />
                )}
              </InfoRow>
              <InfoRow label="이벤트 종류">{deadLetter.eventType ?? <None />}</InfoRow>
              <InfoRow label="이벤트 ID">{deadLetter.eventId ?? <None />}</InfoRow>
              <InfoRow label="보낸 곳">{deadLetter.producer ?? <None />}</InfoRow>
              <InfoRow label="메시지 키">{deadLetter.messageKey ?? <None />}</InfoRow>
              <InfoRow label="원래 위치">
                <Position
                  topic={deadLetter.sourceTopic}
                  partition={deadLetter.sourcePartition}
                  offset={deadLetter.sourceOffset}
                />
              </InfoRow>
            </dl>
          </section>

          <section aria-label="실패 정보" className="space-y-3">
            <h2 className="text-section">실패 정보</h2>
            <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
              <InfoRow label="실패 유형">{deadLetter.failureType}</InfoRow>
              <InfoRow label="예외">{deadLetter.exceptionClass ?? <None />}</InfoRow>
              <InfoRow label="예외 메시지">{deadLetter.exceptionMessage ?? <None />}</InfoRow>
            </dl>
            {deadLetter.stackTraceHead && (
              <details className="border-rule rounded-lg border px-5 py-3">
                <summary className="cursor-pointer text-sm font-semibold">스택 앞부분</summary>
                <pre className="text-ink-2 mt-3 overflow-x-auto text-xs whitespace-pre">
                  {deadLetter.stackTraceHead}
                </pre>
              </details>
            )}
            {deadLetter.payload && (
              <details className="border-rule rounded-lg border px-5 py-3">
                <summary className="cursor-pointer text-sm font-semibold">메시지 본문</summary>
                <pre className="text-ink-2 mt-3 overflow-x-auto text-xs break-all whitespace-pre-wrap">
                  {deadLetter.payload}
                </pre>
              </details>
            )}
          </section>

          <section aria-label="처리 기록" className="space-y-3">
            <h2 className="text-section">처리 기록</h2>
            <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
              <InfoRow label="재처리 횟수">
                <span className="figure">{deadLetter.reprocessCount}회</span>
              </InfoRow>
              <InfoRow label="마지막 재처리">
                {deadLetter.lastReprocessedAt ? (
                  <span className="figure">{formatDateTime(deadLetter.lastReprocessedAt)}</span>
                ) : (
                  <None />
                )}
              </InfoRow>
              <InfoRow label="재처리 실패">{deadLetter.lastReprocessResult ?? <None />}</InfoRow>
              <InfoRow label="처리 관리자">
                {deadLetter.handledBy ? (
                  <span className="figure">{`관리자 ${deadLetter.handledBy}`}</span>
                ) : (
                  <None />
                )}
              </InfoRow>
              <InfoRow label="처리 시각">
                {deadLetter.handledAt ? (
                  <span className="figure">{formatDateTime(deadLetter.handledAt)}</span>
                ) : (
                  <None />
                )}
              </InfoRow>
              <InfoRow label="메모">{deadLetter.memo ?? <None />}</InfoRow>
            </dl>
          </section>
        </>
      )}
    </div>
  )
}
