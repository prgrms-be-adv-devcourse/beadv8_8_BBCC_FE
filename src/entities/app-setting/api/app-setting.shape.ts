import { bool, obj } from '@/shared/api'

export const appSettingShape = obj({ useMock: bool, demoRoleSwitch: bool })
