import { ApplicationStatusBadge, useMySellerApplicationQuery } from '@/entities/seller'
import { ApplySellerForm, RefreshSellerRoleButton } from '@/features/apply-seller'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function SellerApplyPage() {
  const application = useMySellerApplicationQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="② 판매자 신청"
        description="신청 → 관리자 승인 → 토큰 재발급으로 판매자 역할이 반영돼요."
      />
      {application.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {application.isError && (
        <StateMessage tone="error">{getErrorMessage(application.error)}</StateMessage>
      )}
      {application.data === null && <ApplySellerForm />}
      {application.data && (
        <Card className="space-y-2">
          <p className="font-medium">
            {application.data.businessName}{' '}
            <ApplicationStatusBadge status={application.data.status} />
          </p>
          <p className="text-muted-foreground text-sm">
            대표 {application.data.representativeName} · 사업자번호{' '}
            {application.data.maskedBusinessRegistrationNumber} · 신청{' '}
            {formatDateTime(application.data.createdAt)}
          </p>
          {application.data.rejectReason && (
            <StateMessage tone="error">거절 사유: {application.data.rejectReason}</StateMessage>
          )}
          {application.data.status === 'APPROVED' && <RefreshSellerRoleButton />}
        </Card>
      )}
    </div>
  )
}
