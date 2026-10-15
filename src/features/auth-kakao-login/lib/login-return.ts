import { safeReturnPath } from '@/shared/lib'

/** 카카오 로그인 뒤 돌아올 화면. 카카오 인가 화면을 다녀와도 남도록 탭에 저장한다 */
const KEY = 'kidly.login-return'

export function rememberLoginReturn(path: string | null) {
  try {
    const safe = safeReturnPath(path)
    if (safe) sessionStorage.setItem(KEY, safe)
    else sessionStorage.removeItem(KEY)
  } catch {
    // 저장할 수 없으면 홈으로 돌아간다
  }
}

/** 한 번 꺼내면 지운다 (앱 안 주소만) */
export function takeLoginReturn(): string | null {
  try {
    const saved = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return safeReturnPath(saved)
  } catch {
    return null
  }
}
