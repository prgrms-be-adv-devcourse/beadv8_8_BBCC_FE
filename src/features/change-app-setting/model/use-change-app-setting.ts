import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  appSettingApi,
  appSettingKeys,
  planSettingChange,
  toAppSetting,
  toAppSettingRequest,
  type AppSetting,
} from '@/entities/app-setting'
import { isDemoSession, signOutDemo } from '@/entities/session'
import { runWithAction } from '@/shared/api'
import { appSettings, paths } from '@/shared/config'

/**
 * 설정 변경. 이 화면에는 새로고침 없이 바로 적용한다 (다른 방문자는 각자 새로고침해야 반영된다).
 * 목 데이터를 바꾸면 보던 데이터를 다시 불러오고, 시연 계정으로 시연 기능을 끄면 로그아웃해 로그인 화면으로 보낸다
 */
export function useChangeAppSetting() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (next: AppSetting) =>
      runWithAction('설정 변경', () => appSettingApi.update(toAppSettingRequest(next))),
    onSuccess: async (dto) => {
      const before = appSettings.current()
      const after = toAppSetting(dto)
      const plan = planSettingChange(before, after, isDemoSession())
      queryClient.setQueryData(appSettingKeys.all, dto)
      appSettings.apply(after)
      if (plan.signOutDemo) {
        await signOutDemo()
        queryClient.clear()
        navigate(paths.login, { replace: true })
        return
      }
      if (plan.refetchData) {
        await queryClient.invalidateQueries()
      }
    },
  })
}
