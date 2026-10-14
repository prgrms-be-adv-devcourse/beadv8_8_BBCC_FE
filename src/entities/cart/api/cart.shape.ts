import { arr, bool, nullable, num, obj, str } from '@/shared/api'

export const cartShape = obj({
  items: arr(
    obj({
      cartItemId: str,
      optionId: str,
      productId: str,
      productName: str,
      size: str,
      childId: nullable(str),
      quantity: num,
      unitPrice: nullable(num),
      purchasable: bool,
      lineAmount: num,
    }),
  ),
  totalAmount: num,
})
