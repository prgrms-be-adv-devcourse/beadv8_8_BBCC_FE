import { arr, bool, nullable, num, obj, str } from '@/shared/api'

export const cartShape = obj({
  items: arr(
    obj({
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
    }),
  ),
  totalAmount: num,
})
