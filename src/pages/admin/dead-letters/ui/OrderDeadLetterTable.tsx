import { Link } from 'react-router'
import { DeadLetterStatusTag, type OrderDeadLetterSummary } from '@/entities/dead-letter'
import { formatDateTime } from '@/shared/lib'

type OrderDeadLetterTableProps = {
  deadLetters: OrderDeadLetterSummary[]
  deadLetterHref: (id: string) => string
  /** 상세에서 목록으로 돌아올 때 지금 탭 · 상태 · 페이지를 되살린다 */
  listSearch: string
}

const HEAD = 'py-2.5 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'py-3 pr-4 whitespace-nowrap'

/** 주문 처리 실패 메시지 표: 번호(상세 링크) · 마지막으로 받은 시각 · 이벤트 종류 · 관련 주문 · 실패 유형 · 받은 횟수 · 상태 */
export function OrderDeadLetterTable({
  deadLetters,
  deadLetterHref,
  listSearch,
}: OrderDeadLetterTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="주문 처리 실패 메시지" className="w-full min-w-[48rem] text-left text-sm">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-[13px]">
            <th scope="col" className={HEAD}>
              메시지
            </th>
            <th scope="col" className={HEAD}>
              마지막으로 받은 시각
            </th>
            <th scope="col" className={HEAD}>
              이벤트 종류
            </th>
            <th scope="col" className={HEAD}>
              관련 주문
            </th>
            <th scope="col" className={HEAD}>
              실패 유형
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              받은 횟수
            </th>
            <th scope="col" className={HEAD}>
              상태
            </th>
          </tr>
        </thead>
        <tbody className="divide-rule border-rule divide-y border-b">
          {deadLetters.map((deadLetter) => (
            <tr key={deadLetter.id} className="align-middle">
              <td className={CELL}>
                <Link
                  to={deadLetterHref(deadLetter.id)}
                  state={{ listSearch }}
                  className="figure hover:text-signal inline-flex min-h-8 items-center font-semibold underline-offset-4 transition-colors hover:underline"
                >
                  {`메시지 ${deadLetter.id}`}
                </Link>
                {deadLetter.isPaymentEvent && (
                  <span className="bg-paper-2 text-destructive ml-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold">
                    결제
                  </span>
                )}
              </td>
              <td className={`${CELL} figure text-ink-2`}>
                {formatDateTime(deadLetter.lastReceivedAt)}
              </td>
              <td className={`${CELL} figure`}>
                {deadLetter.eventType ?? <span className="text-ink-3">-</span>}
              </td>
              <td className={`${CELL} figure`}>
                {deadLetter.orderId ? (
                  `주문 ${deadLetter.orderId}`
                ) : (
                  <span className="text-ink-3">-</span>
                )}
              </td>
              <td className={`${CELL} text-ink-2`}>{deadLetter.failureType}</td>
              <td className={`${CELL} figure text-right`}>{deadLetter.receivedCount}</td>
              <td className={CELL}>
                <DeadLetterStatusTag status={deadLetter.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
