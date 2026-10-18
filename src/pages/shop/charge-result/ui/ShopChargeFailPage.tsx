import { Link, useSearchParams } from 'react-router'
import { FailCharge } from '@/features/charge-wallet'
import { walletPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'

export function ShopChargeFailPage() {
  const [search] = useSearchParams()
  const area = useArea()
  return (
    <div>
      <PageHeader
        title="충전하지 못했어요"
        note="토스 결제창이 실패 · 취소로 돌아오면 서버에 그 충전을 실패로 알려 바로 끝내요. 알리지 못해도 30분 뒤 만료돼요."
      />
      <Card className="space-y-2">
        <FailCharge search={search} />
        <Link to={walletPathsOf(area).wallet} className="text-primary text-sm underline">
          예치금으로 돌아가기
        </Link>
      </Card>
    </div>
  )
}
