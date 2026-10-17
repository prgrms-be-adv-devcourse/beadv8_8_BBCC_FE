import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '../api/catalog-api'
import { toAttribute, toMeasurementItem } from './catalog.mapper'

export const catalogKeys = {
  all: ['catalog'] as const,
  attributes: ['catalog', 'attributes'] as const,
  measurementItems: ['catalog', 'measurement-items'] as const,
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
