import type { ConfirmOptions } from '@/shared/lib'
import type { AppSetting } from './app-setting'

const RELOAD_NOTICE = '바꾼 설정은 새로고침하면 이 화면에 적용돼요.'

/** 설정은 앱이 시작할 때만 적용되므로, 지금 화면에 적용된 값과 저장된 값이 다르면 새로고침해야 한다 */
export function needsReload(applied: AppSetting, saved: AppSetting): boolean {
  return (
    applied.isMockEnabled !== saved.isMockEnabled ||
    applied.isDemoRoleSwitchEnabled !== saved.isDemoRoleSwitchEnabled
  )
}

/**
 * 새로고침 안내. 필요 없으면 null. 이 화면에서 바꾸면 바로 새로고침하므로, 다른 관리자가 바꿨을 때 보인다.
 * 시연 계정(개발용 토큰)은 시연 기능을 끄고 새로고침하면 다시 로그인되지 않으므로 따로 알린다
 */
export function reloadNotice(
  applied: AppSetting,
  saved: AppSetting,
  isDemoSession: boolean,
): string | null {
  if (!needsReload(applied, saved)) return null
  const turningDemoOff = applied.isDemoRoleSwitchEnabled && !saved.isDemoRoleSwitchEnabled
  if (turningDemoOff && isDemoSession) {
    return '새로고침하면 시연 기능이 꺼지고 시연 계정은 로그아웃돼요. 카카오로 로그인한 관리자만 다시 켤 수 있어요.'
  }
  return RELOAD_NOTICE
}

/** 시연 기능 끄기 확인. 시연 계정이면 다시 켤 수 없게 될 수 있다고 경고한다 */
export function turnOffDemoConfirm(isDemoSession: boolean): ConfirmOptions {
  return {
    title: '시연 기능을 끌까요?',
    description: isDemoSession
      ? '지금은 시연 계정으로 로그인해 있어요. 끄면 바로 새로고침되면서 로그아웃되고, 카카오로 로그인한 관리자만 다시 켤 수 있어요.'
      : '모든 방문자에게 역할 전환 · 시연 콘솔 · API 흐름 패널이 사라지고 카카오 로그인만 남아요. 끄면 바로 새로고침돼요.',
    confirmLabel: '끄기',
    tone: 'danger',
  }
}
