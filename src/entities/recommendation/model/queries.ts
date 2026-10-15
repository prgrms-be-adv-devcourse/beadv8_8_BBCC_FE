import { useQuery } from '@tanstack/react-query'
import { recommendationApi } from '../api/recommendation-api'
import { toRecommendedProduct, toSizeRecommendation } from './recommendation.mapper'

const recommendationKeys = {
  size: (productId: string, childId: string) =>
    ['recommendation', 'size', productId, childId] as const,
  products: (childId: string) => ['recommendation', 'products', childId] as const,
}

export function useSizeRecommendationQuery(productId: string, childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.size(productId, childId ?? ''),
    queryFn: () => recommendationApi.getSize(productId, childId!),
    select: toSizeRecommendation,
    enabled: childId !== null,
  })
}

export function useRecommendedProductsQuery(childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.products(childId ?? ''),
    queryFn: () => recommendationApi.getProducts(childId!),
    select: (page) => ({ ...page, content: page.content.map(toRecommendedProduct) }),
    enabled: childId !== null,
  })
}
