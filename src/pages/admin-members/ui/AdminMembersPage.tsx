import { useState } from 'react'
import {
  canSuspendMember,
  canSuspendSeller,
  MEMBER_FILTER_LABEL,
  MEMBER_STATUS_LABEL,
  useAdminMembersQuery,
  type MemberFilter,
} from '@/entities/member'
import { SuspendMemberForm, SuspendSellerForm } from '@/features/suspend-member'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 관리자 회원 목록 · 이용 정지 · 판매자 자격 정지 */
export function AdminMembersPage() {
  const [filter, setFilter] = useState<MemberFilter>('ALL')
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const members = useAdminMembersQuery(filter, search)

  return (
    <div className="space-y-4">
      <PageHeader
        title="회원 관리"
        description="회원을 찾아 이용 정지하거나 판매자 자격을 정지해요. 관리자 · 탈퇴 회원은 보이지 않아요."
        note="이용 정지 → 로그인 · 재발급 막힘. 판매자 자격 정지 → seller.changed (정지 후 상품 처리는 보류, 기획서 2.1)"
      />
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(MEMBER_FILTER_LABEL) as MemberFilter[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => setFilter(key)}
          >
            {MEMBER_FILTER_LABEL[key]}
          </Button>
        ))}
        <form
          className="ml-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(keyword)
          }}
        >
          <Input
            aria-label="회원 검색"
            placeholder="회원 번호 · 닉네임"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" size="sm" variant="outline">
            검색
          </Button>
        </form>
      </div>
      {members.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {members.isError && (
        <StateMessage tone="error">{getErrorMessage(members.error)}</StateMessage>
      )}
      {members.data?.content.length === 0 && <StateMessage>회원이 없어요.</StateMessage>}
      {members.data?.content.map((member) => (
        <Card key={member.id} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {member.nickname}{' '}
              <span className="text-muted-foreground text-sm">회원 {member.id}</span>
            </p>
            <Badge variant={member.status === 'ACTIVE' ? 'success' : 'destructive'}>
              {MEMBER_STATUS_LABEL[member.status]}
            </Badge>
            {member.sellerStatus && (
              <Badge variant={member.sellerStatus === 'ACTIVE' ? 'default' : 'destructive'}>
                판매자 {member.sellerStatus === 'ACTIVE' ? '판매 가능' : '자격 정지'}
              </Badge>
            )}
            <span className="text-muted-foreground ml-auto text-xs">
              가입 {formatDateTime(member.createdAt)}
            </span>
          </div>
          {member.suspendReason && (
            <p className="text-destructive text-sm">
              정지 사유: {member.suspendReason}
              {member.suspendedAt && ` (${formatDateTime(member.suspendedAt)})`}
            </p>
          )}
          <div className="flex flex-wrap items-start gap-2">
            {canSuspendMember(member) && <SuspendMemberForm memberId={member.id} />}
            {canSuspendSeller(member) && <SuspendSellerForm sellerId={member.id} />}
          </div>
        </Card>
      ))}
    </div>
  )
}
