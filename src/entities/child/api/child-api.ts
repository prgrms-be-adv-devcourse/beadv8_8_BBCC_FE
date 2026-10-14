import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { ChildProfile } from '../model/types'

export const childKeys = {
  all: ['children'] as const,
}

export const childApi = {
  list: () => apiClient.get<ChildProfile[]>('/children').then((response) => response.data),
}

export function useChildrenQuery(enabled = true) {
  return useQuery({ queryKey: childKeys.all, queryFn: childApi.list, enabled })
}
