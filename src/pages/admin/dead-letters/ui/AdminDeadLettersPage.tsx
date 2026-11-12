import { useSearchParams } from 'react-router'
import {
  DEAD_LETTER_MODULES,
  DEAD_LETTER_STATUS_LABEL,
  deadLetterModuleOf,
  deadLetterPageOf,
  deadLetterStatusOf,
  useDeadLettersQuery,
  type DeadLetterModule,
  type DeadLetterStatus,
} from '@/entities/dead-letter'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DeadLetterTable } from './DeadLetterTable'

const MODULES = Object.keys(DEAD_LETTER_MODULES) as DeadLetterModule[]
const STATUSES = Object.keys(DEAD_LETTER_STATUS_LABEL) as DeadLetterStatus[]

/** 처리 실패 메시지(목록): 모듈 탭 → 상태 고르기 → 표 → 페이지. 메시지를 누르면 상세에서 재처리 */
export function AdminDeadLettersPage() {
  // 모듈 · 상태 · 페이지는 주소(?module= · ?status= · ?page=)에 둔다 → 상세에서 돌아와도 그대로
  const [params, setParams] = useSearchParams()
  const module = deadLetterModuleOf(params.get('module'))
  const status = deadLetterStatusOf(params.get('status'))
  const page = deadLetterPageOf(params.get('page'))
  const deadLetters = useDeadLettersQuery(module, status, page)
  const select = (next: {
    module?: DeadLetterModule
    status?: DeadLetterStatus
    page?: number
  }) => {
    const search = new URLSearchParams({
      module: next.module ?? module,
      status: next.status ?? status,
    })
    if (next.page) search.set('page', String(next.page))
    setParams(search, { replace: true })
  }

  const rows = deadLetters.data?.content ?? []

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="처리 실패 메시지"
        description="서비스가 받았지만 처리하지 못한 메시지예요. 원인을 고친 뒤 상세에서 다시 처리해요."
        note="GET /admin/{auth|member|seller|child-profile}-dead-letters?status= (BE #962) · GET /admin/community/dead-letters?status= (커뮤니티, 같은 칸). 재처리는 POST …/{id}/reprocess, 처리기가 다시 실패해도 200(OPEN 유지)."
      />
      <div
        role="tablist"
        aria-label="모듈"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {MODULES.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={module === key}
            onClick={() => select({ module: key })}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center border-b-2 text-[15px] font-bold transition-colors',
              module === key
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink active:text-ink border-transparent',
            )}
          >
            {DEAD_LETTER_MODULES[key].label}
          </button>
        ))}
      </div>

      <section aria-label="메시지 목록" className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <h2 className="text-section mr-auto">
            {DEAD_LETTER_STATUS_LABEL[status]}
            {deadLetters.data && (
              <span className="figure text-ink-3 ml-2 text-sm font-medium">
                {deadLetters.data.totalElements}건
              </span>
            )}
          </h2>
          <div role="group" aria-label="상태" className="flex gap-2">
            {STATUSES.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={status === key}
                onClick={() => select({ status: key })}
                className={cn(
                  'border-rule inline-flex h-10 shrink-0 items-center rounded-md border px-4 text-sm font-semibold transition-colors max-lg:h-11',
                  status === key ? 'border-ink text-ink' : 'text-ink-2 hover:border-field-edge',
                )}
              >
                {DEAD_LETTER_STATUS_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        {deadLetters.isPending && <ListSkeleton />}
        {deadLetters.isError && (
          <StateMessage tone="error">{getErrorMessage(deadLetters.error)}</StateMessage>
        )}
        {deadLetters.data && rows.length === 0 && (
          <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
            {status === 'OPEN' ? '처리를 기다리는 메시지가 없어요.' : '재처리한 메시지가 없어요.'}
          </p>
        )}
        {rows.length > 0 && (
          <DeadLetterTable
            deadLetters={rows}
            deadLetterHref={(id) => paths.admin.deadLetter(module, id)}
            listSearch={params.toString()}
          />
        )}
        {deadLetters.data && (
          <Pagination
            page={deadLetters.data.page}
            totalPages={deadLetters.data.totalPages}
            onChange={(next) => select({ page: next })}
          />
        )}
      </section>
    </div>
  )
}
