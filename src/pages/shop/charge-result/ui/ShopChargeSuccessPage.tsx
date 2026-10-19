import { useSearchParams } from 'react-router'
import { ConfirmCharge } from '@/features/charge-wallet'
import { walletPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'

export function ShopChargeSuccessPage() {
  const [search, setSearch] = useSearchParams()
  const area = useArea()
  return (
    <div>
      <PageHeader
        title="충전 승인"
        description="토스 결제창에서 돌아왔어요. 서버가 토스 승인을 받아야 잔액이 늘어요."
      />
      <Card>
        <ConfirmCharge
          search={search}
          walletHref={walletPathsOf(area).wallet}
          // 승인이 끝나면 주소의 승인 값을 지워, 새로고침 · 뒤로 가기로 다시 승인하지 않게 한다
          onSettled={() => setSearch({}, { replace: true })}
        />
      </Card>
    </div>
  )
}
