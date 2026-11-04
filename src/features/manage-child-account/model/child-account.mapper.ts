import type { ChildAccountRequestDto } from '../api/child-account.dto'
export function toChildAccountRequest(
  childId: string,
  loginId: string,
  password: string,
): ChildAccountRequestDto {
  return { childProfileId: Number(childId), loginId, password }
}
