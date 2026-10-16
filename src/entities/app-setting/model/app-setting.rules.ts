import type { AppSetting } from './app-setting'

/** 목은 앱이 시작할 때만 등록되므로, 지금 화면에 적용된 값과 저장된 값이 다르면 새로고침해야 한다 */
export function needsReload(applied: AppSetting, saved: AppSetting): boolean {
  return applied.isMockEnabled !== saved.isMockEnabled
}
