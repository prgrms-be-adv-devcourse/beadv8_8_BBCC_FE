import { toImageUrl } from '@/shared/lib'
import type {
  CategoryInputsDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductSearchParamsDto,
  ProductListItemDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
  SellerProductDetailDto,
  SellerProductSummaryDto,
} from '../api/product.dto'
import type {
  Category,
  CategoryGroup,
  CategoryInputs,
  InputAttribute,
  ProductDetail,
  ProductListItem,
  ProductOption,
  ProductSearch,
  ProductStatus,
  ProductSummary,
  RegisterProductForm,
  SellerProduct,
  SellerProductDetail,
  StockStatus,
} from './product'
import { categoryNameOf, optionCombos, priceGroups, sizeValues } from './product.rules'

export function toProductListItem(dto: ProductListItemDto): ProductListItem {
  return {
    id: dto.productId,
    name: dto.name,
    imageUrl: toImageUrl(dto.thumbnailUrl),
    businessName: dto.businessName?.trim() || null,
    minPrice: dto.minPrice,
    soldOut: dto.soldOut,
    sizeFree: dto.sizeFree,
  }
}

export function toProductSummary(
  dto: ProductSummaryDto,
  categories: Category[] = [],
): ProductSummary {
  return {
    id: dto.productId,
    name: dto.name,
    brand: dto.brand?.trim() || null,
    categoryId: dto.categoryId,
    categoryName: categoryNameOf(dto.categoryId, categories),
    status: dto.status as ProductStatus,
    minPrice: dto.minPrice,
    imageUrl: toImageUrl(dto.thumbnailUrl),
  }
}

/** 사이즈 항목: 실측(sizeSpecs)의 사이즈 이름을 값으로 가진 옵션 항목. 실측이 없으면 코드에 SIZE가 든 항목 */
function sizeAttributeOf(dto: ProductDetailDto) {
  const sizes = new Set(dto.sizeSpecs.map((spec) => spec.size))
  return (
    dto.optionAttributes.find((attribute) =>
      attribute.values.some((value) => sizes.has(value.value)),
    ) ?? dto.optionAttributes.find((attribute) => /SIZE/i.test(attribute.code))
  )
}

export function toProductDetail(dto: ProductDetailDto, categories: Category[] = []): ProductDetail {
  const sizeAttribute = sizeAttributeOf(dto)
  const sizeNameById = new Map(sizeAttribute?.values.map((value) => [value.valueId, value.value]))
  const specBySize = new Map(dto.sizeSpecs.map((spec) => [spec.size, spec]))
  const options: ProductOption[] = dto.options.map((option) => {
    const sizeValueId = option.valueIds.find((valueId) => sizeNameById.has(valueId))
    const size = sizeValueId ? (sizeNameById.get(sizeValueId) ?? null) : null
    const spec = size ? specBySize.get(size) : undefined
    return {
      id: option.optionId,
      name: option.optionName,
      valueIds: option.valueIds,
      size,
      price: option.price,
      soldOut: !option.purchasable,
      stockStatus: option.stockStatus as StockStatus,
      stockQuantity: option.stockQuantity,
      minHeightCm: spec?.minHeightCm ?? null,
      maxHeightCm: spec?.maxHeightCm ?? null,
    }
  })
  return {
    id: dto.productId,
    name: dto.name,
    brand: dto.brand?.trim() || null,
    businessName: dto.businessName?.trim() || null,
    categoryId: dto.categoryId,
    categoryName: categoryNameOf(dto.categoryId, categories),
    description: dto.description?.trim() || null,
    status: dto.status as ProductStatus,
    minPrice: dto.minPrice,
    imageUrl: toImageUrl(dto.imageUrls[0] ?? null),
    imageUrls: dto.imageUrls,
    sizeFree: dto.sizeFree,
    optionAttributes: dto.optionAttributes.map((attribute) => ({
      id: attribute.attributeId,
      name: attribute.name,
      isSize: attribute.attributeId === sizeAttribute?.attributeId,
      values: attribute.values.map((value) => ({
        id: value.valueId,
        name: value.value,
        colorCode: value.colorCode,
      })),
    })),
    options,
    info: dto.productInfo.map((item) => ({ name: item.name, value: item.value })),
    sizeSpecs: dto.sizeSpecs.map((spec) => ({
      size: spec.size,
      minHeightCm: spec.minHeightCm,
      maxHeightCm: spec.maxHeightCm,
      measurements: dto.measurementItems.map((item) => ({
        name: item.name,
        unit: item.unit,
        value: spec.measurements[item.code] ?? null,
      })),
    })),
  }
}

export function toSellerProduct(dto: SellerProductSummaryDto): SellerProduct {
  return {
    id: dto.productId,
    name: dto.name,
    status: dto.status as ProductStatus,
    imageUrl: toImageUrl(dto.thumbnailUrl),
    optionCount: dto.optionCount,
    totalStock: dto.totalAvailableQuantity,
    minPrice: dto.minPrice,
    createdAt: dto.createdAt,
  }
}

export function toSellerProductDetail(dto: SellerProductDetailDto): SellerProductDetail {
  return {
    id: dto.productId,
    name: dto.name,
    status: dto.status as ProductStatus,
    version: dto.version,
    brand: dto.brand,
    categoryId: dto.categoryId,
    description: dto.description,
    thumbnailUrl: dto.thumbnailUrl,
    imageUrls: dto.imageUrls,
    attributes: dto.attributes,
    options: dto.options.map((option) => ({
      id: option.optionId,
      name: option.optionName,
      valueIds: option.valueIds,
      price: option.price,
      stock: option.availableQuantity,
      onSale: option.saleStatus === 'ON_SALE',
      skuCode: option.skuCode,
    })),
    prices: dto.prices,
    sizeSpecs: dto.sizeSpecs,
  }
}

function toInputAttribute(dto: CategoryInputsDto['attributes'][number]): InputAttribute {
  return {
    id: dto.attributeId,
    code: dto.code,
    name: dto.name,
    inputType: dto.inputType,
    required: dto.required,
    sizeRole: dto.sizeRole,
    priceAffecting: dto.priceAffecting,
    values: dto.values.map((value) => ({
      id: value.valueId,
      name: value.value,
      colorCode: value.colorCode,
    })),
  }
}

export function toCategoryInputs(dto: CategoryInputsDto): CategoryInputs {
  return {
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    optionAttributes: dto.attributes
      .filter((attribute) => attribute.role === 'OPTION')
      .map(toInputAttribute),
    infoAttributes: dto.attributes
      .filter((attribute) => attribute.role === 'INFO')
      .map(toInputAttribute),
    measurementItems: dto.measurementItems,
  }
}

/** 화면의 문자열 ID → 요청의 숫자 ID */
const toIds = (ids: string[]): number[] => ids.map(Number)

/** 대표는 thumbnailUrl과 imageUrls 맨 앞에 함께 보낸다 (구매자 상세는 imageUrls만 받는다). 대표가 없으면 첫 상세가 대표 */
function imagesOf(form: RegisterProductForm) {
  const thumbnailUrl = form.thumbnailUrl ?? form.imageUrls[0] ?? null
  const details = form.imageUrls.filter((url) => url !== thumbnailUrl)
  return { thumbnailUrl, imageUrls: thumbnailUrl ? [thumbnailUrl, ...details] : [] }
}

/** 폼 → BE ProductRegisterRequest. 옵션은 고른 값의 모든 조합, 가격은 가격 구분 항목 묶음마다 */
export function toRegisterProductRequest(
  inputs: CategoryInputs,
  form: RegisterProductForm,
): RegisterProductRequestDto {
  const attributes = inputs.infoAttributes.flatMap<RegisterProductRequestDto['attributes'][number]>(
    (attribute) => {
      const input = form.info[attribute.id]
      if (attribute.values.length > 0) {
        return input?.valueId
          ? [{ attributeId: Number(attribute.id), valueIds: toIds([input.valueId]), text: null }]
          : []
      }
      const text = input?.text.trim() ?? ''
      return text ? [{ attributeId: Number(attribute.id), valueIds: [], text }] : []
    },
  )
  return {
    name: form.name.trim(),
    brand: form.brand.trim() || null,
    categoryId: Number(form.categoryId),
    description: form.description.trim() || null,
    ...imagesOf(form),
    attributes,
    options: optionCombos(inputs, form).map((combo) => ({
      valueIds: toIds(combo.valueIds),
      initialQuantity: form.stocks[combo.key] ?? 0,
      skuCode: form.skuCodes[combo.key]?.trim() || null,
    })),
    prices: priceGroups(inputs, form).map((group) => ({
      valueIds: toIds(group.valueIds),
      price: form.prices[group.key] ?? 0,
    })),
    sizeSpecs: sizeValues(inputs, form).map((value) => {
      const spec = form.sizeSpecs[value.id]
      return {
        sizeValueId: Number(value.id),
        minHeightCm: spec?.minHeightCm || null,
        maxHeightCm: spec?.maxHeightCm || null,
        measurements: Object.fromEntries(
          inputs.measurementItems.map((item) => [item.code, spec?.measurements[item.code] ?? 0]),
        ),
      }
    }),
  }
}

export function toProductSearchParams(search: ProductSearch): ProductSearchParamsDto {
  const params: ProductSearchParamsDto = {}
  if (search.keyword.trim()) params.keyword = search.keyword.trim()
  if (search.categoryId) params.categoryId = search.categoryId
  if (search.sort && search.sort !== 'NEWEST') params.sort = search.sort
  if (search.attributes?.length) params.attributes = search.attributes.slice(0, 20)
  return params
}

/** 카테고리 트리 → 고를 수 있는 끝 카테고리 목록 (순서 유지, 경로 이름 포함) */
export function toCategories(tree: CategoryTreeDto[], parents: string[] = []): Category[] {
  return tree.flatMap((node) => {
    const path = [...parents, node.name]
    return node.leaf || node.children.length === 0
      ? [{ id: node.categoryId, name: node.name, path: path.join(' > ') }]
      : toCategories(node.children, path)
  })
}

/** 카테고리 트리 → 가장 위 카테고리마다 그 아래 끝 카테고리 묶음 (위 카테고리가 끝이면 자신만) */
export function toCategoryGroups(tree: CategoryTreeDto[]): CategoryGroup[] {
  return tree.map((node) => ({
    id: node.categoryId,
    name: node.name,
    categories: toCategories([node]),
  }))
}
