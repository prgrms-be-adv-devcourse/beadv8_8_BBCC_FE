import { listItemMeta, useProductsQuery } from '@/entities/product'
import { AdminStopSaleForm } from '@/features/manage-product'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 관리자: 판매 중인 상품을 보고 정책 위반 상품을 판매 중지 (기획서 8장 보완, BE #315) */
export function AdminProductsPage() {
  const products = useProductsQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        mockEndpoints={['GET /products']}
        title="상품 관리"
        description="판매 중인 상품을 보고, 정책을 어긴 상품은 판매를 중지해요."
        note="PUT /admin/products/{id}/sale-status (STOPPED). 관리자가 중지한 상품은 판매자가 다시 판매할 수 없어요. 판매 중지 사유는 백엔드가 받지 않아요."
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
