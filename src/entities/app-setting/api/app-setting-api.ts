import { apiClient, expectShape } from '@/shared/api'
import type { AppSettingDto, AppSettingRequestDto } from './app-setting.dto'
import { appSettingShape } from './app-setting.shape'

export const appSettingApi = {
  /** 로그인 없이 읽는다 (앱 시작 때 화면을 그리기 전에 부른다) */
  get: () => apiClient.get<AppSettingDto>('/settings').then(expectShape(appSettingShape)),
  /** 관리자만. 바뀐 설정을 돌려준다 */
  update: (request: AppSettingRequestDto) =>
    apiClient.put<AppSettingDto>('/admin/settings', request).then(expectShape(appSettingShape)),
}
