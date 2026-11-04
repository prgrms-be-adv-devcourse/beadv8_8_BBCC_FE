import { Link } from 'react-router'
import { canRemoveChildWishLine, useChildWishQuery } from '@/entities/wish'
import { ChildWishRemoveButton } from '@/features/child-wish-cart'
import { SendChildWish } from '@/features/send-child-wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { MockBadge } from '@/shared/ui/MockBadge'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ChildCartPage() {
  const wish = useChildWishQuery()
  return (
    <section className="space-y-4">
      <h1>
        내 장바구니 <MockBadge endpoints={['GET /child/wish', 'POST /child/wish/requests']} />
      </h1>
      {wish.isPending && <StateMessage>불러오는 중</StateMessage>}
      {wish.isError && <StateMessage tone="error">{getErrorMessage(wish.error)}</StateMessage>}
      {wish.data?.items.length === 0 && (
        <StateMessage>
          담은 상품이 없어요. 상품을 담아 보세요.{' '}
          <Link to={paths.child.products}>상품 보러 가기</Link>
        </StateMessage>
      )}
      {wish.data && wish.data.items.length > 0 && (
        <SendChildWish
          items={wish.data.items}
          renderRemove={(item) => (
            <ChildWishRemoveButton id={item.wishItemId} disabled={!canRemoveChildWishLine(item)} />
          )}
        />
      )}
    </section>
  )
}
