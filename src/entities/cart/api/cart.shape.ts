import { arr, bool, nullable, num, obj, str } from '@/shared/api'

/** 장바구니 한 줄 (BE CartResponse.Line). 담기(POST /cart/items) 응답도 이 모양 */
export const cartLineShape = obj({
  cartItemId: str,
  optionId: str,
  productId: nullable(str),
  sellerId: nullable(str),
  sellerName: nullable(str),
  productName: nullable(str),
  optionName: nullable(str),
  size: nullable(str),
  childId: nullable(str),
  quantity: num,
  unitPrice: nullable(num),
  purchasable: bool,
  lineAmount: num,
  reserved: bool,
})

export const cartShape = obj({
  items: arr(cartLineShape),
  totalAmount: num,
})
