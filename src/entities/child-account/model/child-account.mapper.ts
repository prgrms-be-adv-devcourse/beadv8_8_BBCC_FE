import type { ChildAccountDto } from '../api/child-account.dto'
import type { ChildAccount } from './child-account'
export function toChildAccount(dto: ChildAccountDto): ChildAccount {
  return { id: String(dto.id), childId: String(dto.childProfileId), loginId: dto.loginId }
}
