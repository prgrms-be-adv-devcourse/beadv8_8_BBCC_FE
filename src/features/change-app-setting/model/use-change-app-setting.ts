import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  appSettingApi,
  appSettingKeys,
  needsReload,
  toAppSetting,
  toAppSettingRequest,
  type AppSetting,
} from '@/entities/app-setting'
import { runWithAction } from '@/shared/api'
import { appSettings } from '@/shared/config'

/**
 * 설정 변경. 설정은 앱이 시작할 때 적용되므로, 바꾼 값이 지금 화면과 다르면 바로 새로고침한다.
 * 다른 방문자는 각자 새로고침해야 반영된다
 */
export function useChangeAppSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (next: AppSetting) =>
      runWithAction('설정 변경', () => appSettingApi.update(toAppSettingRequest(next))),
    onSuccess: (dto) => {
      queryClient.setQueryData(appSettingKeys.all, dto)
      if (needsReload(appSettings.current(), toAppSetting(dto))) {
        window.location.reload()
      }
    },
  })
}
