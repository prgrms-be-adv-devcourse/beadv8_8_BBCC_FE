import {
  useChildWishRequestsQuery,
  wishRejectReasonLabel,
  wishDeadlineLabel,
  wishStatusLabel,
} from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'
import { WithdrawChildWishButton } from '@/features/withdraw-child-wish'

export function ChildWishesPage() {
  const wishes = useChildWishRequestsQuery()
  return (
    <section className="space-y-4">
      <h1>내 조르기</h1>
      {wishes.isPending && <StateMessage>불러오는 중</StateMessage>}
      {wishes.isError && <StateMessage tone="error">{getErrorMessage(wishes.error)}</StateMessage>}
      {wishes.data?.length === 0 && <StateMessage>보낸 조르기가 없어요.</StateMessage>}
      {wishes.data?.map((wish) => {
        const deadline = wishDeadlineLabel(wish)
        return (
          <article key={wish.requestId} className="space-y-2 border p-4">
            <p>
              {formatDateTime(wish.requestedAt)} · {wishStatusLabel(wish)}
            </p>
            {deadline && <p className="text-ink-2 text-sm">{deadline}</p>}
            {wish.items.map((item) => (
              <p key={item.optionId}>
                {item.productName} · {item.optionName} · {item.quantity}개
              </p>
            ))}
            {wish.message && <p>{wish.message}</p>}
            {wish.rejectReason && <p>이유: {wishRejectReasonLabel(wish.rejectReason)}</p>}
            <WithdrawChildWishButton wish={wish} />
          </article>
        )
      })}
    </section>
  )
}
