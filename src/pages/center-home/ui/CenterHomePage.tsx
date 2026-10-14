import { Link } from 'react-router'
import { isOnSale, useSellerProductsQuery } from '@/entities/product'
import { SELLER_STATUS_LABEL, useMySellerQuery } from '@/entities/seller'
import { summarizeSellerOrders, useSellerOrdersQuery } from '@/entities/seller-order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 판매자 센터 첫 화면: 오늘 할 일 */
export function CenterHomePage() {
  const orders = useSellerOrdersQuery()
  const products = useSellerProductsQuery()
  const seller = useMySellerQuery()
  const summary = orders.data ? summarizeSellerOrders(orders.data.content) : null
  const onSale = products.data?.content.filter(isOnSale).length

  const tiles = [
    { to: paths.center.orders, label: '발송할 주문', value: summary?.toShip, strong: true },
    { to: paths.center.orders, label: '배송 중', value: summary?.shipping },
    { to: paths.center.orders, label: '배송 완료', value: summary?.delivered },
    { to: paths.center.products, label: '판매 중 상품', value: onSale },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="판매자 센터" description="주문을 발송하고, 상품과 정산을 관리해요." />
      <Card className="flex items-center justify-between">
        {seller.data ? (
          <p className="font-semibold">
            {seller.data.businessName}{' '}
            <span className="text-muted-foreground text-sm font-normal">
              판매자 #{seller.data.id}
            </span>
          </p>
        ) : seller.isError ? (
          <StateMessage tone="error">{getErrorMessage(seller.error)}</StateMessage>
        ) : (
          <StateMessage>내 판매자 정보를 불러오는 중…</StateMessage>
        )}
        {seller.data && (
          <Badge variant={seller.data.status === 'ACTIVE' ? 'success' : 'destructive'}>
            {SELLER_STATUS_LABEL[seller.data.status]}
          </Badge>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to}>
            <Card className="hover:border-primary space-y-1 transition-colors">
              <p className="text-muted-foreground text-sm">{tile.label}</p>
              <p className={tile.strong ? 'text-primary text-3xl font-bold' : 'text-3xl font-bold'}>
                {tile.value ?? '…'}
              </p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="flex items-center justify-between">
        <p className="text-sm">구매확정된 판매 금액은 월 정산 때 수수료를 빼고 지갑에 적립돼요.</p>
        <Link to={paths.center.settlements} className="text-primary text-sm underline">
          정산 보기
        </Link>
      </Card>
    </div>
  )
}
