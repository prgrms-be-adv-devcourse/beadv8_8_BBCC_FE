import { Link } from 'react-router'
import { DeadLetterStatusTag, exceptionShortName, type DeadLetter } from '@/entities/dead-letter'
import { formatDateTime } from '@/shared/lib'

type DeadLetterTableProps = {
  deadLetters: DeadLetter[]
  deadLetterHref: (id: string) => string
  /** 상세에서 목록으로 돌아올 때 지금 모듈 · 상태 · 페이지를 되살린다 */
  listSearch: string
}

const HEAD = 'py-2.5 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'py-3 pr-4 whitespace-nowrap'

/** 처리 실패 메시지 표: 번호(상세 링크) · 받은 시각 · 이벤트 종류 · 실패 예외 · 재처리 횟수 · 상태. 좁으면 표 안에서 옆으로 민다 */
export function DeadLetterTable({ deadLetters, deadLetterHref, listSearch }: DeadLetterTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="처리 실패 메시지" className="w-full min-w-[44rem] text-left text-sm">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-[13px]">
            <th scope="col" className={HEAD}>
              메시지
            </th>
            <th scope="col" className={HEAD}>
              받은 시각
            </th>
            <th scope="col" className={HEAD}>
              이벤트 종류
            </th>
            <th scope="col" className={HEAD}>
              실패 예외
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              재처리 횟수
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
              </td>
              <td className={`${CELL} figure text-ink-2`}>
                {formatDateTime(deadLetter.createdAt)}
              </td>
              <td className={`${CELL} figure`}>
                {deadLetter.eventType ?? <span className="text-ink-3">-</span>}
              </td>
              <td
                className={`${CELL} figure text-ink-2`}
                title={deadLetter.failureType ?? undefined}
              >
                {deadLetter.failureType ? (
                  exceptionShortName(deadLetter.failureType)
                ) : (
                  <span className="text-ink-3">-</span>
                )}
              </td>
              <td className={`${CELL} figure text-right`}>{deadLetter.replayCount}</td>
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
