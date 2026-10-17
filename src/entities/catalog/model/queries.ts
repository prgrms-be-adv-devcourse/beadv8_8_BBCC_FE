import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '../api/catalog-api'
import { toAttribute, toMeasurementItem } from './catalog.mapper'
import { toCatalogCategory } from './category.mapper'
import { toProductType } from './product-type.mapper'

export const catalogKeys = {
  all: ['catalog'] as const,
  attributes: ['catalog', 'attributes'] as const,
  measurementItems: ['catalog', 'measurement-items'] as const,
  productTypes: ['catalog', 'product-types'] as const,
  categories: ['catalog', 'categories'] as const,
}

export function useAttributesQuery() {
  return useQuery({
    queryKey: catalogKeys.attributes,
    queryFn: catalogApi.attributes,
    select: (dtos) => dtos.map(toAttribute),
  })
}

export function useMeasurementItemsQuery() {
  return useQuery({
    queryKey: catalogKeys.measurementItems,
    queryFn: catalogApi.measurementItems,
    select: (dtos) => dtos.map(toMeasurementItem),
  })
}

export function useProductTypesQuery() {
  return useQuery({
    queryKey: catalogKeys.productTypes,
    queryFn: catalogApi.productTypes,
    select: (dtos) => dtos.map(toProductType),
  })
}

export function useCatalogCategoriesQuery() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: catalogApi.categories,
    select: (dtos) => dtos.map(toCatalogCategory),
  })
}
