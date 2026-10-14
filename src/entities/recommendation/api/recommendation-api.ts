import { useQuery } from '@tanstack/react-query'
import { apiClient, type Page } from '@/shared/api'
import type { RecommendedProduct, SizeRecommendation } from '../model/types'

export const recommendationKeys = {
  size: (productId: string, childId: number) =>
    ['recommendation', 'size', productId, childId] as const,
  products: (childId: number) => ['recommendation', 'products', childId] as const,
}

export const recommendationApi = {
  getSize: (productId: string, childId: number) =>
    apiClient
      .get<SizeRecommendation>(`/products/${productId}/size-recommendation`, {
        params: { childId },
      })
      .then((response) => response.data),
  getProducts: (childId: number) =>
    apiClient
      .get<Page<RecommendedProduct>>(`/children/${childId}/recommended-products`, {
        params: { page: 0, size: 20 },
      })
      .then((response) => response.data),
}

export function useSizeRecommendationQuery(productId: string, childId: number | null) {
  return useQuery({
    queryKey: recommendationKeys.size(productId, childId ?? 0),
    queryFn: () => recommendationApi.getSize(productId, childId!),
    enabled: childId !== null,
  })
}

export function useRecommendedProductsQuery(childId: number | null) {
  return useQuery({
    queryKey: recommendationKeys.products(childId ?? 0),
    queryFn: () => recommendationApi.getProducts(childId!),
    enabled: childId !== null,
  })
}
