import { Link } from 'react-router'
import { canRemoveChildWishLine, useChildWishQuery } from '@/entities/wish'
import { ChildWishRemoveButton } from '@/features/child-wish-cart'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { MockBadge } from '@/shared/ui/MockBadge'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ChildCartPage() {
  const wish = useChildWishQuery()
  return (
    <section className="space-y-4">
      <h1>
        내 장바구니 <MockBadge endpoints={['GET /child/wish']} />
      </h1>
      {wish.isPending && <StateMessage>불러오는 중</StateMessage>}
      {wish.isError && <StateMessage tone="error">{getErrorMessage(wish.error)}</StateMessage>}
      {wish.data?.items.length === 0 && (
        <StateMessage>
          담은 상품이 없어요. 상품을 담아 보세요.{' '}
          <Link to={paths.child.products}>상품 보러 가기</Link>
        </StateMessage>
      )}
      {wish.data?.items.map((item) => (
        <div key={item.wishItemId} className="space-y-2 border p-4">
          <p>
            {item.productName} · {item.optionName} · {item.size}
          </p>
          <p>
            {item.quantity}개 · {formatWon(item.lineAmount)} ·{' '}
            {item.addedBy === 'CHILD' ? '나' : '보호자'}
          </p>
          {!item.purchasable && <p>구매할 수 없어요.</p>}
          {item.requestId && <p>진행 중인 조르기에 담겨 있어요.</p>}
          <ChildWishRemoveButton id={item.wishItemId} disabled={!canRemoveChildWishLine(item)} />
        </div>
      ))}
    </section>
  )
}
