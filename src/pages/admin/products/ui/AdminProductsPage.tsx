import { listItemMeta, useProductsQuery } from '@/entities/product'
import { AdminStopSaleForm } from '@/features/manage-product'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 관리자: 판매 중인 상품을 보고 정책 위반 상품을 판매 중지 (기획서 8장 보완 · 목) */
export function AdminProductsPage() {
  const products = useProductsQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        mockEndpoints={['GET /products']}
        title="상품 관리"
        description="판매 중인 상품을 보고, 정책을 어긴 상품은 사유를 남기고 판매를 중지해요."
        note="POST /admin/products/{id}/stop-sale은 백엔드에 없어 목이에요. 중지하면 product.changed로 추천 · 주문 복사본이 바뀌어요."
      />
      {products.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {products.isError && (
        <StateMessage tone="error">{getErrorMessage(products.error)}</StateMessage>
      )}
      {products.data?.content.length === 0 && <StateMessage>판매 중인 상품이 없어요.</StateMessage>}
      {products.data?.content.map((product) => (
        <Card key={product.id} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">{product.name}</span>
          <span className="text-muted-foreground">{listItemMeta(product)}</span>
          {product.minPrice !== null && (
            <span className="ml-auto">{formatWon(product.minPrice)}~</span>
          )}
          <AdminStopSaleForm productId={product.id} />
        </Card>
      ))}
    </div>
  )
}
