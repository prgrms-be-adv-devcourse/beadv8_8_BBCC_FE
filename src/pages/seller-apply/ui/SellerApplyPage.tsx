import { useMutation } from '@tanstack/react-query'
import { APPLICATION_STATUS_LABEL, useMySellerApplicationQuery } from '@/entities/seller'
import { refreshSession } from '@/entities/session'
import { ApplySellerForm } from '@/features/apply-seller'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function SellerApplyPage() {
  const application = useMySellerApplicationQuery()
  // 승인 뒤에는 재발급으로 SELLER 역할을 받는다 (카카오 로그인 세션만 가능. 시연 역할은 판매자 버튼으로 전환)
  const refresh = useMutation({
    mutationFn: () => runWithAction('역할 다시 받기 (재발급)', refreshSession),
  })

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
            <Badge>{APPLICATION_STATUS_LABEL[application.data.status]}</Badge>
          </p>
          <p className="text-muted-foreground text-sm">
            대표 {application.data.representativeName} · 사업자번호{' '}
            {application.data.maskedBusinessRegistrationNumber} · 신청{' '}
            {formatDateTime(application.data.createdAt)}
          </p>
          {application.data.rejectReason && (
            <StateMessage tone="error">거절 사유: {application.data.rejectReason}</StateMessage>
          )}
          {application.data.status === 'APPROVED' && (
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={refresh.isPending} onClick={() => refresh.mutate()}>
                판매자 역할 받기 (토큰 재발급)
              </Button>
              {refresh.isError && (
                <StateMessage tone="error">{getErrorMessage(refresh.error)}</StateMessage>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
