import { useQuery } from '@tanstack/react-query'
import { rateLimitApi } from '../api/rate-limit-api'
import { toRateLimitSettings } from './rate-limit.mapper'

export const rateLimitKeys = {
  settings: ['rate-limit-settings'] as const,
}

export function useRateLimitSettingsQuery() {
  return useQuery({
    queryKey: rateLimitKeys.settings,
    queryFn: rateLimitApi.get,
    select: toRateLimitSettings,
  })
}
