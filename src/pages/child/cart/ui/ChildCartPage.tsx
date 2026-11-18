import { Link } from 'react-router'
import { useChildCartQuery } from '@/entities/cart'
import { lineImageUrl, productIdsWithoutImage, useProductImageUrls } from '@/entities/product'
import { canRemoveChildCartLine } from '@/entities/wish'
import { ChildWishRemoveButton } from '@/features/child-wish-cart'
import { SendChildWish } from '@/features/send-child-wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 자녀 장바구니: 담은 상품(사진 · 판매자 · 금액)을 골라 보호자에게 조르기를 보낸다 */
export function ChildCartPage() {
  const cart = useChildCartQuery()
  const images = useProductImageUrls(productIdsWithoutImage(cart.data?.lines ?? []))
  return (
    <section className="space-y-6">
      <PageHeader title="내 장바구니" description="담은 옷을 골라 보호자에게 조르기를 보내요." />
      {cart.isPending && <StateMessage>불러오는 중</StateMessage>}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data?.lines.length === 0 && (
        <div className="bg-paper-2 space-y-2 p-8 text-center">
          <p className="font-semibold">담은 상품이 없어요</p>
          <p className="text-ink-2 text-[13px]">
            마음에 드는 옷을 담으면 보호자에게 조를 수 있어요.
          </p>
          <Link to={paths.child.products} className="shop-link text-sm">
            상품 보러 가기
          </Link>
        </div>
      )}
      {cart.data && cart.data.lines.length > 0 && (
        // 입력칸 · 보내기 버튼이 넓은 화면 끝까지 늘어나지 않게 폭만 줄인다 (정렬은 다른 자녀 화면처럼 왼쪽)
        <div className="max-w-3xl">
          <SendChildWish
            items={cart.data.lines}
            imageOf={(line) => lineImageUrl(line, images)}
            renderRemove={(item) => (
              <ChildWishRemoveButton id={item.id} disabled={!canRemoveChildCartLine(item)} />
            )}
          />
        </div>
      )}
    </section>
  )
}
