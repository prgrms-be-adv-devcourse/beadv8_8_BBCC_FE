import type {
  ProductDetailDto,
  ProductOptionDto,
  ProductSummaryDto,
  RegisterProductRequestDto,
} from '../api/product.dto'
import type {
  ProductDetail,
  ProductOption,
  ProductStatus,
  ProductSummary,
  RegisterProductForm,
} from './product'

export function toProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: dto.productId,
    name: dto.name,
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
