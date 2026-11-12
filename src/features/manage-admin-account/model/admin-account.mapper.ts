import type { AdminDto } from '../api/admin-account.dto'
import type { AdminAccount } from './admin-account'

export function toAdminAccount(dto: AdminDto): AdminAccount {
  return { id: String(dto.id), email: dto.email, createdAt: dto.createdAt }
}
