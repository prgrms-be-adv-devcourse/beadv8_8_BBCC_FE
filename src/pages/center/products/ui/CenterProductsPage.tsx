import { useState } from 'react'
import { useLocation } from 'react-router'
import {
  canStartSale,
  canStopSale,
  isOnSale,
  PRODUCT_STATUS_LABEL,
  useSellerProductQuery,
  useSellerProductsQuery,
  type SellerProduct,
} from '@/entities/product'
import { AdjustStockForm, EditProductForm, StopSaleButton } from '@/features/manage-product'
import { RegisterProductForm, StartSaleButton } from '@/features/register-product'
import { getErrorMessage } from '@/shared/api'
import { areaOf, paths } from '@/shared/config'
import { Badge } from '@/shared/ui/badge'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'
import { MockBadge } from '@/shared/ui/MockBadge'

export function CenterProductsPage() {
  const products = useSellerProductsQuery()
  const { pathname } = useLocation()
  const productHref = areaOf(pathname) === 'console' ? paths.console.product : paths.shop.product

  return (
    <div className="space-y-4">
      <PageHeader
        title="상품 관리"
        step="②"
        description="상품을 등록 · 수정하고, 판매를 시작 · 중지하고, 재고를 조정해요."
        note="등록 · 판매 시작 · 판매 중지 · 내 상품 · 재고 조정은 실제 API예요. 판매를 시작하면 상품이 product.changed 이벤트를 보내 추천 · 주문이 복사본을 저장해요. 상품 수정만 백엔드에 없어 목이에요 (목 수정은 실제 목록에 반영되지 않아요)."
      />
      <RegisterProductForm productHref={(id) => productHref(id)} />
      <div className="space-y-2">
        <h2 className="font-semibold">내 상품</h2>
        {products.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {products.isError && (
          <StateMessage tone="error">{getErrorMessage(products.error)}</StateMessage>
        )}
        {products.data?.content.length === 0 && <StateMessage>등록한 상품이 없어요.</StateMessage>}
        {products.data?.content.map((product) => (
          <SellerProductRow key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

type SellerProductRowProps = { product: SellerProduct }

/** 목록은 요약(옵션 수 · 총 재고)만 주므로 옵션별 재고는 상품 하나 API로 불러온다 */
function SellerProductRow({ product }: SellerProductRowProps) {
  const [editing, setEditing] = useState(false)
  const detail = useSellerProductQuery(product.id)
  return (
    <Card className="space-y-2" aria-label={`상품 #${product.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {product.name}{' '}
          <Badge variant={isOnSale(product) ? 'success' : 'muted'}>
            {PRODUCT_STATUS_LABEL[product.status]}
          </Badge>
        </p>
        <span className="text-muted-foreground text-sm">
          상품 #{product.id} · 옵션 {product.optionCount}개 · 총 재고 {product.totalStock}
          {product.minPrice !== null && ` · ${formatWon(product.minPrice)}부터`}
        </span>
        <span className="ml-auto flex items-center gap-1">
          {!editing && detail.data && (
            <span className="inline-flex items-center">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                수정
              </Button>
              <MockBadge endpoints={['PATCH /seller/products/:productId']} />
            </span>
          )}
          {canStopSale(product) && <StopSaleButton productId={product.id} />}
          {canStartSale(product) && <StartSaleButton productId={product.id} />}
        </span>
      </div>
      {detail.isError && <StateMessage tone="error">{getErrorMessage(detail.error)}</StateMessage>}
      <ul className="space-y-1">
        {detail.data?.options.map((option) => (
          <li
            key={option.id}
            className="flex flex-wrap items-center gap-2 text-sm"
            aria-label={`옵션 ${option.name}`}
          >
            <span>
              {option.name} · {formatWon(option.price)}
            </span>
            <span className={option.stock === 0 ? 'text-destructive' : 'text-muted-foreground'}>
              재고 {option.stock}
              {option.stock === 0 && ' (품절)'}
            </span>
            <AdjustStockForm option={option} />
          </li>
        ))}
      </ul>
      {editing && detail.data && (
        <EditProductForm product={detail.data} onDone={() => setEditing(false)} />
      )}
    </Card>
  )
}
