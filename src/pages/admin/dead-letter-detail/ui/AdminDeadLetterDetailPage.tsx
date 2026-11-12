import { Link, useLocation, useParams } from 'react-router'
import {
  DEAD_LETTER_MODULES,
  DEAD_LETTER_STATUS_LABEL,
  isDeadLetterModule,
  useDeadLetterQuery,
  type DeadLetterModule,
} from '@/entities/dead-letter'
import { ReprocessDeadLetterButton } from '@/features/reprocess-dead-letter'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, formatDateTime } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { InfoRow } from './InfoRow'
import { None } from './None'
import { NotFound } from './NotFound'
import { Position } from './Position'
import { OrderDeadLetterDetail } from './OrderDeadLetterDetail'

/** 처리 실패 메시지 상세: 지금 상태 + 재처리 → 메시지 정보 → 재처리 기록 */
export function AdminDeadLetterDetailPage() {
  const { module, deadLetterId = '' } = useParams()
  if (module === 'order') return <OrderDeadLetterDetail deadLetterId={deadLetterId} />
  if (!isDeadLetterModule(module)) return <NotFound />
  return <DeadLetterDetail module={module} deadLetterId={deadLetterId} />
}

type DeadLetterDetailProps = { module: DeadLetterModule; deadLetterId: string }

function DeadLetterDetail({ module, deadLetterId }: DeadLetterDetailProps) {
  // 목록에서 넘겨준 모듈 · 상태 · 페이지(?module= · ?status= · ?page=)로 돌아간다
  const listSearch =
    (useLocation().state as { listSearch?: string } | null)?.listSearch ?? `module=${module}`
  const query = useDeadLetterQuery(module, deadLetterId)
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
        description={`${DEAD_LETTER_MODULES[module].label} 모듈이 처리하지 못한 메시지예요.`}
        note={`GET ${DEAD_LETTER_MODULES[module].path}/{id} (BE #962). 메시지 본문은 응답에 없다.`}
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
              {DEAD_LETTER_STATUS_LABEL[deadLetter.status]}
            </h2>
            <ReprocessDeadLetterButton
              key={deadLetter.id}
              module={module}
              deadLetter={deadLetter}
            />
          </section>

          <section aria-label="메시지 정보" className="space-y-3">
            <h2 className="text-section">메시지 정보</h2>
            <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
              <InfoRow label="받은 시각">
                <span className="figure">{formatDateTime(deadLetter.createdAt)}</span>
              </InfoRow>
              <InfoRow label="이벤트 종류">{deadLetter.eventType ?? <None />}</InfoRow>
              <InfoRow label="이벤트 ID">{deadLetter.eventId ?? <None />}</InfoRow>
              <InfoRow label="메시지 키">{deadLetter.messageKey ?? <None />}</InfoRow>
              <InfoRow label="실패 예외">{deadLetter.failureType ?? <None />}</InfoRow>
              <InfoRow label="원래 위치">
                <Position
                  topic={deadLetter.sourceTopic}
                  partition={deadLetter.sourcePartition}
                  offset={deadLetter.sourceOffset}
                />
              </InfoRow>
              <InfoRow label="보관 위치">
                <Position
                  topic={deadLetter.dltTopic}
                  partition={deadLetter.dltPartition}
                  offset={deadLetter.dltOffset}
                />
              </InfoRow>
            </dl>
          </section>

          <section aria-label="재처리 기록" className="space-y-3">
            <h2 className="text-section">재처리 기록</h2>
            <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
              <InfoRow label="재처리 횟수">
                <span className="figure">{deadLetter.replayCount}회</span>
              </InfoRow>
              <InfoRow label="마지막 재처리">
                {deadLetter.lastReplayedAt ? (
                  <span className="figure">{formatDateTime(deadLetter.lastReplayedAt)}</span>
                ) : (
                  <None />
                )}
              </InfoRow>
              <InfoRow label="재처리 관리자">
                {deadLetter.lastReplayedBy ? (
                  <span className="figure">{`관리자 ${deadLetter.lastReplayedBy}`}</span>
                ) : (
                  <None />
                )}
              </InfoRow>
              <InfoRow label="재처리 실패">{deadLetter.lastReplayFailureType ?? <None />}</InfoRow>
            </dl>
          </section>
        </>
      )}
    </div>
  )
}
