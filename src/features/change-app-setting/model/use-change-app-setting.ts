import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  appSettingApi,
  appSettingKeys,
  toAppSettingRequest,
  type AppSetting,
} from '@/entities/app-setting'
import { runWithAction } from '@/shared/api'

/** 설정 변경. 모든 방문자에게 적용되지만, 각자 새로고침해야 화면에 반영된다 */
export function useChangeAppSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (next: AppSetting) =>
      runWithAction('설정 변경', () => appSettingApi.update(toAppSettingRequest(next))),
    onSuccess: (dto) => queryClient.setQueryData(appSettingKeys.all, dto),
  })
}
