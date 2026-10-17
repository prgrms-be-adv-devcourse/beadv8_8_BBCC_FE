import type { AppSettingDto, AppSettingRequestDto } from '../api/app-setting.dto'
import type { AppSetting } from './app-setting'

export function toAppSetting(dto: AppSettingDto): AppSetting {
  return { isMockEnabled: dto.useMock, isDemoRoleSwitchEnabled: dto.demoRoleSwitch }
}

export function toAppSettingRequest(setting: AppSetting): AppSettingRequestDto {
  return { useMock: setting.isMockEnabled, demoRoleSwitch: setting.isDemoRoleSwitchEnabled }
}
