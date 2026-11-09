import { Link } from 'react-router'
import { useChildCartQuery } from '@/entities/cart'
import { canRemoveChildCartLine } from '@/entities/wish'
import { ChildWishRemoveButton } from '@/features/child-wish-cart'
import { SendChildWish } from '@/features/send-child-wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ChildCartPage() {
  const cart = useChildCartQuery()
  return (
    <section className="space-y-4">
      <h1>내 장바구니</h1>
      {cart.isPending && <StateMessage>불러오는 중</StateMessage>}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data?.lines.length === 0 && (
        <StateMessage>
          담은 상품이 없어요. 상품을 담아 보세요.{' '}
          <Link to={paths.child.products}>상품 보러 가기</Link>
        </StateMessage>
      )}
      {cart.data && cart.data.lines.length > 0 && (
        <SendChildWish
          items={cart.data.lines}
          renderRemove={(item) => (
            <ChildWishRemoveButton id={item.id} disabled={!canRemoveChildCartLine(item)} />
          )}
        />
      )}
    </section>
  )
}
