import { arr, bool, nullable, num, obj, oneOf, pageOf, recordOf, str } from '@/shared/api'

const STATUS = oneOf(['SALE_PENDING', 'ON_SALE', 'STOPPED'])
const value = obj({ valueId: str, value: str, colorCode: nullable(str) })
const measurementItem = obj({ code: str, name: str, unit: str })

export const productDetailShape = obj({
  productId: str,
  name: str,
  brand: nullable(str),
  categoryId: str,
  description: nullable(str),
  status: STATUS,
  sizeFree: bool,
  minPrice: nullable(num),
  imageUrls: arr(str),
  optionAttributes: arr(obj({ attributeId: str, code: str, name: str, values: arr(value) })),
  options: arr(
    obj({
      optionId: str,
      optionName: str,
      valueIds: arr(str),
      price: num,
      purchasable: bool,
      stockStatus: oneOf(['AVAILABLE', 'LOW', 'SOLD_OUT']),
      stockQuantity: nullable(num),
    }),
  ),
  productInfo: arr(obj({ code: str, name: str, value: nullable(str) })),
  sizeSpecs: arr(
    obj({
      size: str,
      minHeightCm: nullable(num),
      maxHeightCm: nullable(num),
      measurements: recordOf(num),
    }),
  ),
  measurementItems: arr(measurementItem),
})

export const registerProductResultShape = obj({
  productId: str,
  status: STATUS,
  version: num,
  options: arr(
    obj({
      optionId: str,
      optionName: str,
      price: num,
      availableQuantity: num,
      saleStatus: str,
      skuCode: nullable(str),
    }),
  ),
})

export const saleStatusResultShape = obj({ productId: str, status: STATUS, version: num })

export const categoryInputsShape = obj({
  categoryId: str,
  categoryName: str,
  productTypeId: str,
  productTypeName: str,
  attributes: arr(
    obj({
      attributeId: str,
      code: str,
      name: str,
      inputType: str,
      role: oneOf(['OPTION', 'INFO']),
      required: bool,
      sizeRole: bool,
      priceAffecting: bool,
      values: arr(value),
    }),
  ),
  measurementItems: arr(measurementItem),
})

export const productListPageShape = pageOf(
  obj({
    productId: str,
    name: str,
    thumbnailUrl: nullable(str),
    businessName: nullable(str),
    minPrice: num,
    soldOut: bool,
    sizeFree: bool,
  }),
)

/** 카테고리 트리: 세 단계까지 모양을 본다 (더 깊은 단계는 검사하지 않음) */
const categoryNode = (depth: number): ReturnType<typeof obj> =>
  obj({
    categoryId: str,
    name: str,
    leaf: bool,
    ...(depth > 0 ? { children: arr(categoryNode(depth - 1)) } : {}),
  })
export const categoryTreeShape = arr(categoryNode(3))

export const sellerProductSummaryPageShape = pageOf(
  obj({
    productId: str,
    name: str,
    thumbnailUrl: nullable(str),
    status: STATUS,
    optionCount: num,
    totalAvailableQuantity: num,
    minPrice: nullable(num),
    createdAt: str,
  }),
)
export const sellerProductDetailShape = obj({
  productId: str,
  name: str,
  status: STATUS,
  version: num,
  brand: nullable(str),
  categoryId: str,
  description: nullable(str),
  thumbnailUrl: nullable(str),
  imageUrls: arr(str),
  attributes: arr(obj({ attributeId: str, valueIds: arr(str), text: nullable(str) })),
  options: arr(
    obj({
      optionId: str,
      optionName: str,
      valueIds: arr(str),
      price: num,
      availableQuantity: num,
      saleStatus: str,
      skuCode: nullable(str),
    }),
  ),
  prices: arr(obj({ valueIds: arr(str), price: num })),
  sizeSpecs: arr(
    obj({
      sizeValueId: str,
      minHeightCm: nullable(num),
      maxHeightCm: nullable(num),
      measurements: recordOf(num),
    }),
  ),
})
export const inventoryAdjustmentResultShape = obj({
  optionId: str,
  reason: str,
  deltaQuantity: num,
  availableQuantity: num,
})
