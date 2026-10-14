import { useQuery } from '@tanstack/react-query'
import { childApi } from '../api/child-api'
import { toChild } from './child.mapper'

export const childKeys = {
  all: ['children'] as const,
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
