import { useSearchParams } from 'react-router'
import { ConfirmCharge } from '@/features/charge-wallet'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'

export function ChargeSuccessPage() {
  const [search] = useSearchParams()
  return (
    <div>
      <PageHeader
        title="충전 승인"
        description="토스 결제창에서 돌아왔어요. 서버가 토스 승인을 받아야 잔액이 늘어요."
      />
      <Card>
        <ConfirmCharge search={search} />
      </Card>
    </div>
  )
}
