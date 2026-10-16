import type { AdminMemberDto } from '../api/member.dto'
import type { AdminMember, MemberStatus } from './member'

export function toAdminMember(dto: AdminMemberDto, isAdmin: boolean): AdminMember {
  return {
    id: String(dto.id),
    nickname: dto.nickname,
    email: dto.email ?? null,
    status: dto.status as MemberStatus,
    sellerStatus: dto.sellerStatus as AdminMember['sellerStatus'],
    suspendReason: dto.suspendReason,
    suspendedAt: dto.suspendedAt,
    createdAt: dto.createdAt,
    isAdmin,
  }
}
