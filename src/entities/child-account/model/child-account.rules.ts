import type { ChildAccount } from './child-account'
export const isValidChildLoginId = (value: string) => /^[a-z0-9]{4,20}$/.test(value)
/** 백엔드 ChildPassword: 공백만은 안 되고(@NotBlank) 8자 이상 · UTF-8 72바이트(BCrypt 상한) 이하 */
export const isValidChildPassword = (value: string) =>
  value.trim() !== '' && value.length >= 8 && new TextEncoder().encode(value).length <= 72
export const accountOfChild = (accounts: ChildAccount[], childId: string) =>
  accounts.find((account) => account.childId === childId)
