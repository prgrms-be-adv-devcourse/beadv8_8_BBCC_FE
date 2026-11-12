/** 백엔드 AdminPassword: 12자 이상 */
export const ADMIN_PASSWORD_MIN_LENGTH = 12
/** 백엔드 AdminPassword: UTF-8 72바이트 이하 (BCrypt가 보는 최대 길이) */
export const ADMIN_PASSWORD_MAX_BYTES = 72

/** 관리자 비밀번호 검사. 길이는 BE와 같이 UTF-16 글자 수로 센다. 문제가 없으면 null */
export function validateAdminPassword(password: string): string | null {
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH)
    return `비밀번호는 ${ADMIN_PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`
  if (new TextEncoder().encode(password).length > ADMIN_PASSWORD_MAX_BYTES)
    return `비밀번호가 너무 길어요. 영문 기준 ${ADMIN_PASSWORD_MAX_BYTES}자까지예요.`
  return null
}
