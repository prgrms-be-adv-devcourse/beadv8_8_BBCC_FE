import { Link, useNavigate, useParams } from 'react-router'
import {
  useWishRequestQuery,
  useWishTimelineQuery,
  canDecideWish,
  wishLineDecisionLabel,
  wishStatusLabel,
  wishTimelineLabel,
  wishTimelineStatusLabel,
} from '@/entities/wish'
import { DecideWish } from '@/features/decide-wish'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { formatDateTime, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ShopChildWishDetailPage() {
  const { requestId = '' } = useParams()
  const paths = memberPathsOf(useArea())
  const navigate = useNavigate()
  const wish = useWishRequestQuery(requestId)
  const timeline = useWishTimelineQuery(requestId)
  if (wish.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (wish.isError) return <StateMessage tone="error">{getErrorMessage(wish.error)}</StateMessage>
  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.childWishes(wish.data.childId)}
        className="text-ink-3 hover:text-ink inline-flex text-sm font-semibold"
      >
        받은 조르기
      </Link>
      <PageHeader title="조르기 상세" />
      <section className="border-rule space-y-4 rounded-lg border p-4 md:p-5">
        <p>
          {wishStatusLabel(wish.data)} · {formatDateTime(wish.data.requestedAt)}
        </p>
        {wish.data.message && <p>{wish.data.message}</p>}
        {wish.data.items.map((item) => {
          const decision = wishLineDecisionLabel(wish.data, item)
          return (
            <p key={item.wishItemId}>
              {item.productName} · {item.optionName} · {item.requestedQuantity}개
              {decision && ` · ${decision}`}
            </p>
          )
        })}
        {wish.data.decidedAt && <p>답한 시각 {formatDateTime(wish.data.decidedAt)}</p>}
      </section>
      {canDecideWish(wish.data) && (
        <DecideWish
          wish={wish.data}
          addressesPath={paths.addresses}
          onApproved={(orderId) => navigate(paths.order(orderId))}
        />
      )}
      {timeline.isError && (
        <StateMessage tone="error">{getErrorMessage(timeline.error)}</StateMessage>
      )}
      {timeline.data && (
        <section className="border-rule space-y-4 rounded-lg border p-4 md:p-5">
          <h2 className="text-section">진행 상황</h2>
          {timeline.data.steps.map((step) => (
            <p key={step.step}>
              {wishTimelineLabel(step.step)} · {wishTimelineStatusLabel(step.status)}{' '}
              {step.at ? formatDateTime(step.at) : ''}
            </p>
          ))}
        </section>
      )}
    </div>
  )
}
