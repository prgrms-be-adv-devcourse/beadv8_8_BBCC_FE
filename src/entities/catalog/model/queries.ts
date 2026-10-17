import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '../api/catalog-api'
import { toMeasurementItem } from './catalog.mapper'

export const catalogKeys = {
  all: ['catalog'] as const,
  measurementItems: ['catalog', 'measurement-items'] as const,
}

export function useMeasurementItemsQuery() {
  return useQuery({
    queryKey: catalogKeys.measurementItems,
    queryFn: catalogApi.measurementItems,
    select: (dtos) => dtos.map(toMeasurementItem),
  })
}
