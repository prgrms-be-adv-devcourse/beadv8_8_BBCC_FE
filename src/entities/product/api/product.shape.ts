import { arr, bool, nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

const summaryFields = {
  productId: str,
  name: str,
  categoryId: str,
  categoryName: str,
  sellerId: str,
  sellerName: str,
  status: oneOf(['SALE_PENDING', 'ON_SALE', 'STOPPED']),
  minPrice: num,
  thumbnailUrl: nullable(str),
}

export const productDetailShape = obj({
  ...summaryFields,
  description: str,
  options: arr(
    obj({
      optionId: str,
      color: str,
      material: str,
      size: str,
      price: num,
      stock: num,
      minHeightCm: num,
      maxHeightCm: num,
      soldOut: bool,
    }),
  ),
})

export const productPageShape = pageOf(obj(summaryFields))
export const productDetailPageShape = pageOf(productDetailShape)
