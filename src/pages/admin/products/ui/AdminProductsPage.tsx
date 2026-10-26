import { listItemMeta, ProductImage, useProductsQuery } from '@/entities/product'
import { AdminStopSaleForm } from '@/features/manage-product'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 관리자: 판매 중인 상품 표, 줄마다 판매 중지 (기획서 8장 보완, BE #315) */
export function AdminProductsPage() {
  const products = useProductsQuery()
  const items = products.data?.content ?? []

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        mockEndpoints={['GET /products']}
        title="상품 관리"
        description="판매 중인 상품을 보고, 정책을 어긴 상품은 판매를 중지해요."
        note="PUT /admin/products/{id}/sale-status (STOPPED). 관리자가 중지한 상품은 판매자가 다시 판매할 수 없어요. 판매 중지 사유는 백엔드가 받지 않아요."
      />

      <section aria-label="판매 중 상품" className="space-y-3">
        <h2 className="text-section">
          판매 중 상품
          {products.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">{items.length}개</span>
          )}
        </h2>
        {products.isPending && <ListSkeleton />}
        {products.isError && (
          <StateMessage tone="error">{getErrorMessage(products.error)}</StateMessage>
        )}
        {products.data && items.length === 0 && (
          <p className="bg-paper-2 text-ink-2 rounded-lg py-10 text-center text-sm">
            판매 중인 상품이 없어요.
          </p>
        )}
        {items.length > 0 && (
          <table aria-label="판매 중 상품" className="w-full text-sm max-lg:block">
            <thead className="max-lg:sr-only">
              <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
                <th scope="col" className="w-16 py-2 pr-4 font-medium">
                  <span className="sr-only">대표 사진</span>
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  상품
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  판매가
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  <span className="sr-only">판매 중지</span>
                </th>
              </tr>
            </thead>
            <tbody className="max-lg:block">
              {items.map((product) => (
                <tr
                  key={product.id}
                  className="border-rule border-b max-lg:grid max-lg:grid-cols-[3rem_minmax(0,1fr)] max-lg:gap-x-3 max-lg:gap-y-1.5 max-lg:py-4"
                >
                  <td className="py-3 pr-4 align-middle max-lg:row-span-3 max-lg:p-0">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="aspect-square size-12 rounded-sm"
                    />
                  </td>
                  <td className="py-3 pr-4 align-middle max-lg:col-start-2 max-lg:p-0">
                    <p className="text-ink font-semibold break-all">{product.name}</p>
                    <p className="text-ink-3 text-[13px]">{listItemMeta(product)}</p>
                  </td>
                  <td className="figure py-3 pr-4 text-right align-middle whitespace-nowrap max-lg:col-start-2 max-lg:p-0 max-lg:text-left">
                    {formatWon(product.minPrice)}부터
                  </td>
                  <td className="py-3 text-right align-middle max-lg:col-start-2 max-lg:p-0 max-lg:pt-1.5 max-lg:text-left">
                    <span className="inline-flex">
                      <AdminStopSaleForm productId={product.id} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
