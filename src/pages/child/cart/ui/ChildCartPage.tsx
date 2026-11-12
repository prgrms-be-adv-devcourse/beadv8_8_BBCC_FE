import { Link } from 'react-router'
import { useChildCartQuery } from '@/entities/cart'
import { useProductImageUrls } from '@/entities/product'
import { canRemoveChildCartLine } from '@/entities/wish'
import { ChildWishRemoveButton } from '@/features/child-wish-cart'
import { SendChildWish } from '@/features/send-child-wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 자녀 장바구니: 담은 상품(사진 · 판매자 · 금액)을 골라 보호자에게 조르기를 보낸다 */
export function ChildCartPage() {
  const cart = useChildCartQuery()
  const images = useProductImageUrls(cart.data?.lines.map((line) => line.productId) ?? [])
  return (
    <section className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-page">내 장바구니</h1>
      {cart.isPending && <StateMessage>불러오는 중</StateMessage>}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data?.lines.length === 0 && (
        <StateMessage>
          담은 상품이 없어요. 상품을 담아 보세요.{' '}
          <Link to={paths.child.products} className="shop-link">
            상품 보러 가기
          </Link>
        </StateMessage>
      )}
      {cart.data && cart.data.lines.length > 0 && (
        <SendChildWish
          items={cart.data.lines}
          imageOf={(productId) => (productId ? (images[productId] ?? null) : null)}
          renderRemove={(item) => (
            <ChildWishRemoveButton id={item.id} disabled={!canRemoveChildCartLine(item)} />
          )}
        />
      )}
    </section>
  )
}
