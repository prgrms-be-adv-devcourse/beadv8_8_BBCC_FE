import { useState } from 'react'
import { Link } from 'react-router'
import { isOnSale, stockLevelOf, useSellerProductsQuery } from '@/entities/product'
import { sumSettlementItems, useSettlementTargetsQuery } from '@/entities/settlement'
import { SELLER_STATUS_LABEL, useMySellerQuery } from '@/entities/seller'
import { EditBusinessNameForm } from '@/features/edit-seller-info'
import { summarizeSellerOrders, useSellerOrdersQuery } from '@/entities/seller-order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 판매자 센터 첫 화면: 오늘 할 일 */
export function CenterHomePage() {
  const orders = useSellerOrdersQuery()
  const products = useSellerProductsQuery()
  const seller = useMySellerQuery()
  const [editingName, setEditingName] = useState(false)
  const summary = orders.data ? summarizeSellerOrders(orders.data.content) : null
  const targets = useSettlementTargetsQuery()
  const onSaleCount = products.data?.content.filter(isOnSale).length
  const lowStockCount = products.data?.content.filter(
    (product) => stockLevelOf(product.totalStock) !== 'OK',
  ).length
  const pendingSettlement = targets.data ? sumSettlementItems(targets.data.content) : undefined

  // 누르면 그 탭 · 거르기로 바로 (주소 ?tab= · ?stock=)
  const tiles: {
    to: string
    label: string
    value: number | string | undefined
    tone?: 'primary' | 'warn'
  }[] = [
    {
      to: `${paths.center.orders}?tab=READY`,
      label: '발송할 주문',
      value: summary?.toShip,
      tone: 'primary',
    },
    { to: `${paths.center.orders}?tab=SHIPPING`, label: '배송 중', value: summary?.shipping },
    { to: `${paths.center.orders}?tab=DELIVERED`, label: '배송 완료', value: summary?.delivered },
    { to: paths.center.products, label: '판매 중 상품', value: onSaleCount },
    {
      to: `${paths.center.products}?stock=low`,
      label: '재고 적은 상품',
      value: lowStockCount,
      tone: lowStockCount ? 'warn' : undefined,
    },
    {
      to: paths.center.settlements,
      label: '정산 예정 (구매확정분)',
      value: pendingSettlement === undefined ? undefined : formatWon(pendingSettlement),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="판매자 센터" description="주문을 발송하고, 상품과 정산을 관리해요." />
      <Card className="flex items-center justify-between">
        {seller.data && editingName ? (
          <EditBusinessNameForm
            current={seller.data.businessName}
            onDone={() => setEditingName(false)}
          />
        ) : seller.data ? (
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
        {seller.data && !editingName && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setEditingName(true)}
          >
            상호명 수정
          </Button>
        )}
        {seller.data && (
          <Badge variant={seller.data.status === 'ACTIVE' ? 'success' : 'destructive'}>
            {SELLER_STATUS_LABEL[seller.data.status]}
          </Badge>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to}>
            <Card className="hover:border-primary space-y-1 transition-colors">
              <p className="text-muted-foreground text-sm">{tile.label}</p>
              <p
                className={
                  tile.tone === 'primary'
                    ? 'text-primary text-3xl font-bold'
                    : tile.tone === 'warn'
                      ? 'text-3xl font-bold text-amber-600'
                      : 'text-3xl font-bold'
                }
              >
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
