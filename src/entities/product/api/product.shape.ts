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

/** 카테고리 트리: 세 단계까지 모양을 본다 (더 깊은 단계는 검사하지 않음) */
const categoryNode = (depth: number): ReturnType<typeof obj> =>
  obj({
    categoryId: str,
    name: str,
    leaf: bool,
    ...(depth > 0 ? { children: arr(categoryNode(depth - 1)) } : {}),
  })
export const categoryTreeShape = arr(categoryNode(3))
