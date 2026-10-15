import { useState } from 'react'
import {
  canStartSale,
  canStopSale,
  isOnSale,
  PRODUCT_STATUS_LABEL,
  useSellerProductsQuery,
  type ProductDetail,
} from '@/entities/product'
import { AdjustStockForm, EditProductForm, StopSaleButton } from '@/features/manage-product'
import { RegisterProductForm, StartSaleButton } from '@/features/register-product'
import { getErrorMessage } from '@/shared/api'
import { Badge } from '@/shared/ui/badge'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function SellerProductsPage() {
  const products = useSellerProductsQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="상품 관리"
        step="②"
        description="상품을 등록 · 수정하고, 판매를 시작 · 중지하고, 재고를 조정해요."
        note="판매를 시작하면 상품이 product.changed 이벤트를 보내 추천 · 주문이 복사본을 저장해요. (상품 API는 목)"
      />
      <RegisterProductForm />
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

function SellerProductRow({ product }: { product: ProductDetail }) {
  const [editing, setEditing] = useState(false)
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {product.name}{' '}
          <Badge variant={isOnSale(product) ? 'success' : 'muted'}>
            {PRODUCT_STATUS_LABEL[product.status]}
          </Badge>
        </p>
        <span className="text-muted-foreground text-sm">{product.categoryName}</span>
        <span className="ml-auto flex items-center gap-1">
          {!editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              수정
            </Button>
          )}
          {canStopSale(product) && <StopSaleButton productId={product.id} />}
          {canStartSale(product) && <StartSaleButton productId={product.id} />}
        </span>
      </div>
      <ul className="space-y-1">
        {product.options.map((option) => (
          <li
            key={option.id}
            className="flex flex-wrap items-center gap-2 text-sm"
            aria-label={`옵션 ${option.size}`}
          >
            <span>
              {option.color} / {option.material} / {option.size} · {formatWon(option.price)} · 권장
              키 {option.minHeightCm}~{option.maxHeightCm}cm
            </span>
            <span className={option.soldOut ? 'text-destructive' : 'text-muted-foreground'}>
              재고 {option.stock}
              {option.soldOut && ' (품절)'}
            </span>
            <AdjustStockForm productId={product.id} option={option} />
          </li>
        ))}
      </ul>
      {editing && <EditProductForm product={product} onDone={() => setEditing(false)} />}
    </Card>
  )
}
