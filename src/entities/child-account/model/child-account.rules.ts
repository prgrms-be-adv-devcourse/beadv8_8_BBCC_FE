import type { ChildAccount } from './child-account'
export const isValidChildLoginId = (value: string) => /^[a-z0-9]{4,20}$/.test(value)
export const isValidChildPassword = (value: string) => value.length >= 8
export const accountOfChild = (accounts: ChildAccount[], childId: string) =>
  accounts.find((account) => account.childId === childId)
