import { toImageUrl } from '@/shared/lib'
import type {
  CategoryTreeDto,
  ProductDetailDto,
  ProductOptionDto,
  ProductSearchParamsDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
  UpdateProductRequestDto,
} from '../api/product.dto'
import type {
  Category,
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
    imageUrl: toImageUrl(dto.thumbnailUrl),
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

/** 카테고리 트리 → 고를 수 있는 끝 카테고리 목록 (순서 유지, 경로 이름 포함) */
export function toCategories(tree: CategoryTreeDto[], parents: string[] = []): Category[] {
  return tree.flatMap((node) => {
    const path = [...parents, node.name]
    return node.leaf || node.children.length === 0
      ? [{ id: node.categoryId, name: node.name, path: path.join(' > ') }]
      : toCategories(node.children, path)
  })
}
