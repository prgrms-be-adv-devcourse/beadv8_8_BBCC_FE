import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import {
  canStartSale,
  canStopSale,
  filterSellerProducts,
  isOnSale,
  stockLevelOf,
  type StockLevel,
  PRODUCT_STATUS_LABEL,
  useSellerProductQuery,
  useSellerProductsQuery,
  type SellerProduct,
} from '@/entities/product'
import { AdjustStockForm, EditProductForm, StopSaleButton } from '@/features/manage-product'
import { RegisterProductForm, StartSaleButton } from '@/features/register-product'
import { ProductImageUploader } from '@/features/upload-product-image'
import { getErrorMessage } from '@/shared/api'
import { areaOf, paths } from '@/shared/config'
import { Badge } from '@/shared/ui/badge'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function CenterProductsPage() {
  const products = useSellerProductsQuery()
  const { pathname } = useLocation()
  const productHref = areaOf(pathname) === 'console' ? paths.console.product : paths.shop.product
  // 거르기는 주소에 (홈 "재고 적은 상품"에서 ?stock=low로 열린다)
  const [params, setParams] = useSearchParams()
  const keyword = params.get('q') ?? ''
  const lowStockOnly = params.get('stock') === 'low'
  const setFilter = (key: 'q' | 'stock', value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }
  const all = products.data?.content ?? []
  const visible = filterSellerProducts(all, { keyword, lowStockOnly })

  return (
    <div className="space-y-4">
      <PageHeader
        title="상품 관리"
        step="②"
        description="상품을 등록 · 수정하고, 판매를 시작 · 중지하고, 재고를 조정해요."
        note="등록 · 수정 · 판매 시작 · 판매 중지 · 내 상품 · 재고 조정은 모두 실제 API예요. 판매를 시작하면 상품이 product.changed 이벤트를 보내 추천 · 주문이 복사본을 저장해요. 수정은 등록과 같은 값을 모두 보내는 PUT이고, 읽어 간 version이 다르면 409예요. 옵션 · 판매가 · 실측은 판매 시작 전에만 바꿀 수 있고, 재고는 재고 조정으로 바꿔요. 사진은 브라우저에서 긴 변 2000px JPG로 줄인 뒤, 업로드 주소를 발급받아 S3에 바로 올리고 그 주소를 등록 요청에 담아요."
      />
      <RegisterProductForm
        productHref={(id) => productHref(id)}
        renderImages={(field) => <ProductImageUploader {...field} />}
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">내 상품 {products.data && `${all.length}개`}</h2>
          <Input
            aria-label="내 상품 찾기"
            placeholder="상품명으로 찾기"
            className="ml-auto h-8 w-48 bg-white"
            value={keyword}
            onChange={(e) => setFilter('q', e.target.value || null)}
          />
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              className="accent-primary size-4"
              checked={lowStockOnly}
              onChange={(e) => setFilter('stock', e.target.checked ? 'low' : null)}
            />
            재고 적은 상품만
          </label>
        </div>
        {products.isPending && <ListSkeleton />}
        {products.isError && (
          <StateMessage tone="error">{getErrorMessage(products.error)}</StateMessage>
        )}
        {products.data && all.length === 0 && <StateMessage>등록한 상품이 없어요.</StateMessage>}
        {products.data && all.length > 0 && visible.length === 0 && (
          <StateMessage>조건에 맞는 상품이 없어요.</StateMessage>
        )}
        {visible.map((product) => (
          <SellerProductRow
            key={product.id}
            product={product}
            buyerHref={isOnSale(product) ? productHref(product.id) : null}
          />
        ))}
      </div>
    </div>
  )
}

const STOCK_BADGE: Record<StockLevel, { label: string; className: string } | null> = {
  OUT: { label: '품절', className: 'bg-destructive/10 text-destructive' },
  LOW: { label: '재고 적음', className: 'bg-amber-100 text-amber-800' },
  OK: null,
}

function StockBadge({ stock }: { stock: number }) {
  const badge = STOCK_BADGE[stockLevelOf(stock)]
  return badge ? (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  ) : null
}

type SellerProductRowProps = { product: SellerProduct; buyerHref: string | null }

/** 목록은 요약(옵션 수 · 총 재고)만 주므로 옵션별 재고는 상품 하나 API로 불러온다 */
function SellerProductRow({ product, buyerHref }: SellerProductRowProps) {
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
        <StockBadge stock={product.totalStock} />
        <span className="ml-auto flex items-center gap-1">
          {buyerHref && (
            <Link to={buyerHref} className="text-muted-foreground mr-1 text-xs underline">
              구매자 화면으로 보기
            </Link>
          )}
          {!editing && detail.data && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              수정
            </Button>
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
            </span>
            <StockBadge stock={option.stock} />
            <AdjustStockForm option={option} />
          </li>
        ))}
      </ul>
      {editing && detail.data && (
        <EditProductForm
          product={detail.data}
          onDone={() => setEditing(false)}
          renderImages={(field) => <ProductImageUploader {...field} />}
        />
      )}
    </Card>
  )
}
