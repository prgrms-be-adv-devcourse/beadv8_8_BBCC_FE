import { Link } from 'react-router'
import { useChildCartQuery } from '@/entities/cart'
import { lineImageUrl, productIdsWithoutImage, useProductImageUrls } from '@/entities/product'
import { canRemoveChildCartLine } from '@/entities/wish'
import { ChildWishRemoveButton } from '@/features/child-wish-cart'
import { SendChildWish } from '@/features/send-child-wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { optionLabel } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'

const HEADING = (
  <div className="flex flex-col gap-2">
    <h1 className="font-display text-[36px] leading-none md:text-[64px]">내 장바구니</h1>
    <p className="font-hand text-[19px] md:text-2xl">보호자에게 조를 옷을 골라 봐</p>
  </div>
)

/** 자녀 장바구니: 담은 옷(사진 · 판매자 · 금액)을 골라 보호자에게 조르기 쪽지를 보낸다 */
export function ChildCartPage() {
  const cart = useChildCartQuery()
  const images = useProductImageUrls(productIdsWithoutImage(cart.data?.lines ?? []))
  if (cart.data && cart.data.lines.length > 0)
    return (
      <SendChildWish
        heading={HEADING}
        items={cart.data.lines}
        imageOf={(line) => lineImageUrl(line, images)}
        renderRemove={(item) => (
          <ChildWishRemoveButton
            id={item.id}
            disabled={!canRemoveChildCartLine(item)}
            label={[item.productName, optionLabel(item)].filter(Boolean).join(' ')}
          />
        )}
      />
    )
  return (
    <section className="flex flex-col gap-6 md:gap-9">
      <div className="border-ink border-b-[3px] pb-4 md:pb-5">{HEADING}</div>
      {cart.isPending && <StateMessage>불러오는 중</StateMessage>}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data && (
        <div className="bg-paper-2 flex flex-col items-center gap-2.5 p-8 text-center md:p-12">
          <p className="font-display text-[26px]">담은 옷이 없어</p>
          <p className="text-[15px]">마음에 드는 옷을 담으면 보호자에게 조를 수 있어.</p>
          <Link
            to={paths.child.products}
            className="text-ink flex min-h-11 items-center font-bold underline underline-offset-4"
          >
            옷 구경하러 가기 <span aria-hidden>&nbsp;→</span>
          </Link>
        </div>
      )}
    </section>
  )
}
