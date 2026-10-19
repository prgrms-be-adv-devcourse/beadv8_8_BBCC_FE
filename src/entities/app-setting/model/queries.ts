import { useQuery } from '@tanstack/react-query'
import { appSettingApi } from '../api/app-setting-api'
import { toAppSetting } from './app-setting.mapper'

export const appSettingKeys = {
  all: ['app-setting'] as const,
}

export function useAppSettingQuery() {
  return useQuery({
    queryKey: appSettingKeys.all,
    queryFn: appSettingApi.get,
    select: toAppSetting,
  })
}
