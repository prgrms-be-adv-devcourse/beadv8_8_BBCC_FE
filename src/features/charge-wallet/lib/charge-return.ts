import { safeReturnPath } from '@/shared/lib'

/** 충전 뒤 돌아갈 화면 (예: 주문서). 토스 결제창을 다녀와도 남도록 탭에 저장한다 */
export type ChargeReturn = { path: string; label: string }

const KEY = 'kidly.charge-return'

export function rememberChargeReturn(target: ChargeReturn | null) {
  try {
    if (target) sessionStorage.setItem(KEY, JSON.stringify(target))
    else sessionStorage.removeItem(KEY)
  } catch {
    // 저장할 수 없으면 돌아가기 링크만 빠진다
  }
}

export function readChargeReturn(): ChargeReturn | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Partial<ChargeReturn> | null
    const path = safeReturnPath(saved?.path)
    return path && saved?.label ? { path, label: saved.label } : null
  } catch {
    return null
  }
}
