import type { CategoryDto, CategoryCreateRequestDto } from '../api/catalog.dto'
import type { CatalogCategory, CategoryForm } from './catalog'
import { toMeasurementItem } from './catalog.mapper'

export function toCatalogCategory(dto: CategoryDto): CatalogCategory {
  return {
    id: dto.categoryId,
    name: dto.name,
    parentId: dto.parentId,
    isLeaf: dto.leaf,
    productTypeId: dto.productTypeId,
    productTypeName: dto.productTypeName,
    measurementItems: dto.measurementItems.map(toMeasurementItem),
  }
}

/** 중간 카테고리는 고른 유형 · 실측 항목을 보내지 않는다 (BE는 중간 카테고리에 실측 항목이 있으면 400) */
export function toCategoryCreateRequest(form: CategoryForm): CategoryCreateRequestDto {
  const isLeaf = form.kind === 'LEAF'
  return {
    name: form.name.trim(),
    parentId: form.parentId || null,
    productTypeId: isLeaf ? form.productTypeId : null,
    measurementItemIds: isLeaf ? form.measurementItemIds : [],
  }
}
