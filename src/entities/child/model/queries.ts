import { useQuery } from '@tanstack/react-query'
import { childApi } from '../api/child-api'
import { toChild, toGrowthRecord } from './child.mapper'

export const childKeys = {
  all: ['children'] as const,
  detail: (childId: string) => ['children', 'detail', childId] as const,
  growth: (childId: string) => ['children', 'growth', childId] as const,
}

/** enabled: 보호자가 아닐 때 부르지 않으려면 false (쇼핑 첫 화면) */
export function useChildrenQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: childKeys.all,
    queryFn: childApi.list,
    select: (list) => list.map(toChild),
  })
}

export function useChildQuery(childId: string) {
  return useQuery({
    queryKey: childKeys.detail(childId),
    queryFn: () => childApi.get(childId),
    select: toChild,
  })
}

export function useGrowthRecordsQuery(childId: string) {
  return useQuery({
    queryKey: childKeys.growth(childId),
    queryFn: () => childApi.growthRecords(childId),
    select: (list) => list.map(toGrowthRecord),
  })
}
