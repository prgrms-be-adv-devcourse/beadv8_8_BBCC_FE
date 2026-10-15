import type {
  ProductDetailDto,
  ProductOptionDto,
  ProductSearchParamsDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
  UpdateProductRequestDto,
} from '../api/product.dto'
import type {
  ProductDetail,
  ProductEditForm,
  ProductSearch,
  ProductOption,
  ProductStatus,
  ProductSummary,
  RegisterProductForm,
} from './product'

export function toProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: dto.productId,
    name: dto.name,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    sellerName: dto.sellerName,
    status: dto.status as ProductStatus,
    minPrice: dto.minPrice,
  }
}

function toProductOption(dto: ProductOptionDto): ProductOption {
  return {
    id: dto.optionId,
    color: dto.color,
    material: dto.material,
    size: dto.size,
    price: dto.price,
    stock: dto.stock,
    minHeightCm: dto.minHeightCm,
    maxHeightCm: dto.maxHeightCm,
    soldOut: dto.soldOut,
  }
}

export function toProductDetail(dto: ProductDetailDto): ProductDetail {
  return {
    ...toProductSummary(dto),
    description: dto.description,
    options: dto.options.map(toProductOption),
  }
}

export function toRegisterProductRequest(form: RegisterProductForm): RegisterProductRequestDto {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    description: '',
    options: form.sizes.map((row) => ({
      ...row,
      size: row.size.trim(),
      color: form.color,
      material: form.material,
    })),
  }
}

export function toProductEditForm(product: ProductDetail): ProductEditForm {
  return {
    name: product.name,
    categoryId: product.categoryId,
    description: product.description,
    prices: Object.fromEntries(product.options.map((option) => [option.id, option.price])),
  }
}

export function toUpdateProductRequest(form: ProductEditForm): UpdateProductRequestDto {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    description: form.description,
    options: Object.entries(form.prices).map(([optionId, price]) => ({ optionId, price })),
  }
}

export function toProductSearchParams(search: ProductSearch): ProductSearchParamsDto {
  const params: ProductSearchParamsDto = {}
  if (search.keyword.trim()) params.keyword = search.keyword.trim()
  if (search.categoryId) params.categoryId = search.categoryId
  return params
}
