import { useSearchParams } from 'react-router'
import {
  DEAD_LETTER_MODULES,
  DEAD_LETTER_STATUS_LABEL,
  deadLetterPageOf,
  deadLetterStatusOf,
  deadLetterTabOf,
  ORDER_DEAD_LETTER_STATUS_LABEL,
  orderDeadLetterStatusOf,
  useDeadLettersQuery,
  useOrderDeadLettersQuery,
  type DeadLetterModule,
  type DeadLetterTab,
} from '@/entities/dead-letter'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DeadLetterTable } from './DeadLetterTable'
import { OrderDeadLetterTable } from './OrderDeadLetterTable'
import { StatusFilter } from './StatusFilter'

const TABS: { key: DeadLetterTab; label: string }[] = [
  ...(Object.keys(DEAD_LETTER_MODULES) as DeadLetterModule[]).map((key) => ({
    key,
    label: DEAD_LETTER_MODULES[key].label,
  })),
  { key: 'order', label: '주문' },
]

type Selection = { module?: DeadLetterTab; status?: string; page?: number }

/** 처리 실패 메시지(목록): 모듈 탭 → 상태 고르기 → 표 → 페이지. 메시지를 누르면 상세에서 재처리 (주문은 확인 후 종료도) */
export function AdminDeadLettersPage() {
  // 모듈 · 상태 · 페이지는 주소(?module= · ?status= · ?page=)에 둔다 → 상세에서 돌아와도 그대로
  const [params, setParams] = useSearchParams()
  const tab = deadLetterTabOf(params.get('module'))
  const page = deadLetterPageOf(params.get('page'))
  const select = (next: Selection) => {
    const search = new URLSearchParams({ module: next.module ?? tab })
    // 탭을 바꿔도 상태는 그대로 (모듈 목록에 없는 확인 후 종료는 처리 대기로 읽는다)
    const status = next.status ?? params.get('status')
    if (status) search.set('status', status)
    if (next.page) search.set('page', String(next.page))
    setParams(search, { replace: true })
  }

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="처리 실패 메시지"
        description="서비스가 받았지만 처리하지 못한 메시지예요. 원인을 고친 뒤 상세에서 다시 처리해요."
        note="GET /admin/{auth|member|seller|child-profile}-dead-letters?status= (BE #962) · GET /admin/community/dead-letters?status= (커뮤니티, 같은 칸) · GET /admin/orders/dead-letters?status= (주문 #601, 확인 후 종료 CLOSED 있음). 재처리는 POST …/{id}/reprocess, 처리기가 다시 실패해도 200(OPEN 유지)."
      />
      <div
        role="tablist"
        aria-label="모듈"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => select({ module: key })}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center border-b-2 text-[15px] font-bold transition-colors',
              tab === key
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink active:text-ink border-transparent',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'order' ? (
        <OrderSection
          status={orderDeadLetterStatusOf(params.get('status'))}
          page={page}
          listSearch={params.toString()}
          onSelect={select}
        />
      ) : (
        <ModuleSection
          module={tab}
          status={deadLetterStatusOf(params.get('status'))}
          page={page}
          listSearch={params.toString()}
          onSelect={select}
        />
      )}
    </div>
  )
}

type SectionProps<S> = {
  status: S
  page: number
  listSearch: string
  onSelect: (next: Selection) => void
}

function ModuleSection({
  module,
  status,
  page,
  listSearch,
  onSelect,
}: SectionProps<keyof typeof DEAD_LETTER_STATUS_LABEL> & { module: DeadLetterModule }) {
  const deadLetters = useDeadLettersQuery(module, status, page)
  const rows = deadLetters.data?.content ?? []
  return (
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
        <StatusFilter
          labels={DEAD_LETTER_STATUS_LABEL}
          value={status}
          onChange={(next) => onSelect({ status: next })}
        />
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
          listSearch={listSearch}
        />
      )}
      {deadLetters.data && (
        <Pagination
          page={deadLetters.data.page}
          totalPages={deadLetters.data.totalPages}
          onChange={(next) => onSelect({ page: next })}
        />
      )}
    </section>
  )
}

const ORDER_EMPTY: Record<keyof typeof ORDER_DEAD_LETTER_STATUS_LABEL, string> = {
  OPEN: '처리를 기다리는 메시지가 없어요.',
  REPROCESSED: '재처리한 메시지가 없어요.',
  CLOSED: '확인 후 종료한 메시지가 없어요.',
}

function OrderSection({
  status,
  page,
  listSearch,
  onSelect,
}: SectionProps<keyof typeof ORDER_DEAD_LETTER_STATUS_LABEL>) {
  const deadLetters = useOrderDeadLettersQuery(status, page)
  const rows = deadLetters.data?.content ?? []
  return (
    <section aria-label="메시지 목록" className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <h2 className="text-section mr-auto">
          {ORDER_DEAD_LETTER_STATUS_LABEL[status]}
          {deadLetters.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">
              {deadLetters.data.totalElements}건
            </span>
          )}
        </h2>
        <StatusFilter
          labels={ORDER_DEAD_LETTER_STATUS_LABEL}
          value={status}
          onChange={(next) => onSelect({ status: next })}
        />
      </div>
      <p className="text-ink-3 text-[13px]">결제에서 온 메시지는 돈이 걸려 있어 맨 앞에 와요.</p>
      {deadLetters.isPending && <ListSkeleton />}
      {deadLetters.isError && (
        <StateMessage tone="error">{getErrorMessage(deadLetters.error)}</StateMessage>
      )}
      {deadLetters.data && rows.length === 0 && (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
          {ORDER_EMPTY[status]}
        </p>
      )}
      {rows.length > 0 && (
        <OrderDeadLetterTable
          deadLetters={rows}
          deadLetterHref={(id) => paths.admin.deadLetter('order', id)}
          listSearch={listSearch}
        />
      )}
      {deadLetters.data && (
        <Pagination
          page={deadLetters.data.page}
          totalPages={deadLetters.data.totalPages}
          onChange={(next) => onSelect({ page: next })}
        />
      )}
    </section>
  )
}
