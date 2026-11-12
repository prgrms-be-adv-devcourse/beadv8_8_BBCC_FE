import { Link, useParams } from 'react-router'
import {
  useWishRequestsQuery,
  wishDeadlineLabel,
  wishStatusLabel,
  wishTitle,
} from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { formatDateTime, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ShopChildWishesPage() {
  const { childId = '' } = useParams()
  const paths = memberPathsOf(useArea())
  const wishes = useWishRequestsQuery(childId)
  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.child(childId)}
        className="text-ink-3 hover:text-ink inline-flex text-sm font-semibold"
      >
        자녀 프로필
      </Link>
      <PageHeader title="받은 조르기" />
      {wishes.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {wishes.isError && <StateMessage tone="error">{getErrorMessage(wishes.error)}</StateMessage>}
      {wishes.data?.length === 0 && <StateMessage>받은 조르기가 없어요.</StateMessage>}
      {wishes.data?.map((wish) => (
        <Link
          className="border-rule block space-y-2 rounded-lg border p-4 md:p-5"
          key={wish.requestId}
          to={paths.childWish(childId, wish.requestId)}
        >
          {wishTitle(wish)} · {wishStatusLabel(wish)}
          <p>
            {[formatDateTime(wish.requestedAt), wishDeadlineLabel(wish)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </Link>
      ))}
    </div>
  )
}
