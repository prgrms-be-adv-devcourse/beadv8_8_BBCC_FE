import { useQuery } from '@tanstack/react-query'
import { childApi } from '../api/child-api'
import { toChild } from './child.mapper'

export const childKeys = {
  all: ['children'] as const,
}

export function useChildrenQuery() {
  return useQuery({
    queryKey: childKeys.all,
    queryFn: childApi.list,
    select: (list) => list.map(toChild),
  })
}
