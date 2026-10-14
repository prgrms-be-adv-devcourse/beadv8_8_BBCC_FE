import { Link, useSearchParams } from 'react-router'
import { walletPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'

export function ChargeFailPage() {
  const [search] = useSearchParams()
  const area = useArea()
  return (
    <div>
      <PageHeader title="충전하지 못했어요" />
      <Card className="space-y-2">
        <p className="text-sm">{search.get('message') ?? '결제가 취소되었거나 실패했어요.'}</p>
        <Link to={walletPathsOf(area).wallet} className="text-primary text-sm underline">
          예치금으로 돌아가기
        </Link>
      </Card>
    </div>
  )
}
