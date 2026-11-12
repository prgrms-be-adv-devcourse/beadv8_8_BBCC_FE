import type { AdminDto } from '../api/admin-account.dto'
import type { AdminAccount, AdminStatus } from './admin-account'

export function toAdminAccount(dto: AdminDto): AdminAccount {
  return {
    id: String(dto.id),
    email: dto.email,
    status: dto.status as AdminStatus,
    createdAt: dto.createdAt,
  }
}
