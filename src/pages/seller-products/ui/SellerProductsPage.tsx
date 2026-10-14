import {
  canStartSale,
  describeSizes,
  isOnSale,
  PRODUCT_STATUS_LABEL,
  useSellerProductsQuery,
} from '@/entities/product'
import { RegisterProductForm, StartSaleButton } from '@/features/register-product'
import { getErrorMessage } from '@/shared/api'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function SellerProductsPage() {
  const products = useSellerProductsQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="② 상품 등록 (판매자)"
        description="판매를 시작하면 상품이 product.changed 이벤트를 보내 추천 · 주문이 복사본을 저장해요. (상품 API는 목)"
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
          <Card key={product.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {product.name}{' '}
                <Badge variant={isOnSale(product) ? 'success' : 'muted'}>
                  {PRODUCT_STATUS_LABEL[product.status]}
                </Badge>
              </p>
              <p className="text-muted-foreground text-sm">{describeSizes(product)}</p>
            </div>
            {canStartSale(product) && <StartSaleButton productId={product.id} />}
          </Card>
        ))}
      </div>
    </div>
  )
}
