import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  canDelist,
  canStartSale,
  canStopSale,
  isOnSale,
  PRODUCT_STATUS_LABEL,
  ProductImage,
  SELLER_PRODUCT_TABS,
  sellerProductStockTagsOf,
  sellerProductTabOf,
  toSellerProductTabSearch,
  useSellerProductCountQuery,
  useSellerProductsQuery,
  type SellerProduct,
  type SellerProductTab,
  type StockTag as StockTagValue,
} from '@/entities/product'
import { DelistButton, StopSaleButton } from '@/features/manage-product'
import { StartSaleButton } from '@/features/register-product'
import { getErrorMessage } from '@/shared/api'
import { OPTION_STOCK, sellerPathsOf } from '@/shared/config'
import { cn, formatWon, useArea } from '@/shared/lib'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { Pagination } from '@/shared/ui/Pagination'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

const PAGE_SIZE = 20

/**
 * 상품 관리(목록): 제목 줄의 「상품 등록」, 상태 탭, 내 상품 표, 페이지 번호.
 * 탭 · 쪽은 서버가 거르고 나눈다 (전체 상품 기준). 옵션별 재고 · 수정은 상품 상세에서
 */
export function CenterProductsPage() {
  const sellerPaths = sellerPathsOf(useArea())
  // 탭은 주소에 (홈 숫자에서 ?status= · ?stock=low로 열린다)
  const [params, setParams] = useSearchParams()
  const tab = sellerProductTabOf({ status: params.get('status'), stock: params.get('stock') })
  const [page, setPage] = useState(0)
  const products = useSellerProductsQuery(tab, page, PAGE_SIZE)
  const handleTab = (next: SellerProductTab) => {
    setPage(0)
    setParams(toSellerProductTabSearch(next), { replace: true })
  }
  const list = products.data?.content ?? []

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        title="상품 관리"
        step="②"
        description="내 상품의 판매 상태와 재고를 보고, 판매를 시작하거나 중지해요."
        note="내 상품 · 판매 시작 · 판매 중지는 모두 실제 API예요. 목록은 요약(옵션 수 · 총 재고 · 최저가)만 주고, 옵션별 재고는 상품 상세에서 상품 하나 API로 불러와요. 판매를 시작하면 상품이 product.changed 이벤트를 보내 추천 · 주문이 복사본을 저장해요."
        actions={
          <Link
            to={sellerPaths.productNew}
            className="shop-btn min-h-10 shrink-0 px-4 text-sm max-lg:min-h-11"
          >
            상품 등록
          </Link>
        }
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <h2 className="text-section mr-auto">내 상품</h2>
        </div>
        <div
          role="tablist"
          aria-label="판매 상태"
          className="border-rule flex gap-6 overflow-x-auto border-b"
        >
          {SELLER_PRODUCT_TABS.map((item) => (
            <button
              key={item.tab}
              type="button"
              role="tab"
              aria-selected={tab === item.tab}
              onClick={() => handleTab(item.tab)}
              className={cn(
                '-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 text-[15px] font-bold transition-colors',
                tab === item.tab
                  ? 'border-ink text-ink'
                  : 'text-ink-3 hover:text-ink active:text-ink border-transparent',
              )}
            >
              {item.label} <TabCount tab={item.tab} />
            </button>
          ))}
        </div>

        {products.isPending && <ListSkeleton />}
        {products.isError && (
          <StateMessage tone="error">{getErrorMessage(products.error)}</StateMessage>
        )}
        {products.data && list.length === 0 && (
          <StateMessage>
            {tab === 'ALL' ? '등록한 상품이 없어요.' : '이 탭에 해당하는 상품이 없어요.'}
          </StateMessage>
        )}
        {list.length > 0 && (
          <table aria-label="내 상품" className="w-full text-sm max-lg:block">
            <thead className="max-lg:sr-only">
              <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
                <th scope="col" className="w-16 py-2 pr-4 font-medium">
                  <span className="sr-only">대표 사진</span>
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  상품명
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  상태
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  옵션
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  총 재고
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  판매가
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  <span className="sr-only">판매</span>
                </th>
              </tr>
            </thead>
            <tbody className="max-lg:block">
              {list.map((product) => (
                <SellerProductRow
                  key={product.id}
                  product={product}
                  detailHref={sellerPaths.product(product.id)}
                />
              ))}
            </tbody>
          </table>
        )}
        {products.data && (
          <Pagination page={page} totalPages={products.data.totalPages} onChange={setPage} />
        )}
      </section>
    </div>
  )
}

type SellerProductRowProps = { product: SellerProduct; detailHref: string }

/** 표의 한 줄. 휴대폰은 사진 옆에 라벨 붙은 묶음으로 다시 쌓는다 */
function SellerProductRow({ product, detailHref }: SellerProductRowProps) {
  return (
    <tr className="border-rule border-b max-lg:grid max-lg:grid-cols-[3rem_minmax(0,1fr)] max-lg:gap-x-3 max-lg:gap-y-1.5 max-lg:py-4">
      <td className="py-3 pr-4 align-middle max-lg:row-span-6 max-lg:p-0">
        {product.imageUrl && (
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square size-12 rounded-sm"
          />
        )}
      </td>
      <td className="py-3 pr-4 align-middle max-lg:col-start-2 max-lg:p-0">
        <Link
          to={detailHref}
          className="text-ink hover:text-signal active:text-signal-deep inline-flex items-center font-semibold transition-colors max-lg:min-h-11"
        >
          {product.name}
        </Link>
        <p className="figure text-ink-3 text-[13px]">상품 #{product.id}</p>
      </td>
      <td className="py-3 pr-4 align-middle max-lg:col-start-2 max-lg:p-0">
        <StatusTag product={product} />
      </td>
      <td className="figure py-3 pr-4 text-right align-middle max-lg:col-start-2 max-lg:p-0 max-lg:text-left">
        <CellLabel>옵션</CellLabel> {product.optionCount}개
      </td>
      <td className="py-3 pr-4 text-right align-middle max-lg:col-start-2 max-lg:p-0 max-lg:text-left">
        <span className="inline-flex flex-wrap items-center gap-2">
          <CellLabel>총 재고</CellLabel>
          <span className="figure font-bold">{product.totalStock}</span>
          {sellerProductStockTagsOf(product).map((tag) => (
            <StockTag key={tag.kind} tag={tag} href={`${detailHref}#${OPTION_STOCK}`} />
          ))}
        </span>
      </td>
      <td className="figure py-3 pr-4 text-right align-middle max-lg:col-start-2 max-lg:p-0 max-lg:text-left">
        <CellLabel>판매가</CellLabel>{' '}
        {product.minPrice !== null ? `${formatWon(product.minPrice)}부터` : '–'}
      </td>
      <td className="py-3 text-right align-middle max-lg:col-start-2 max-lg:p-0 max-lg:pt-1.5 max-lg:text-left">
        <span className="inline-flex flex-wrap gap-2">
          {canStopSale(product) && <StopSaleButton productId={product.id} />}
          {canStartSale(product) && <StartSaleButton productId={product.id} />}
          {canDelist(product) && <DelistButton productId={product.id} />}
        </span>
      </td>
    </tr>
  )
}

type CellLabelProps = { children: ReactNode }

/** 휴대폰에서만 보이는 칸 이름 (넓은 화면은 표 머리) */
function CellLabel({ children }: CellLabelProps) {
  return <span className="text-ink-3 mr-1 text-[13px] lg:hidden">{children}</span>
}

type StatusTagProps = { product: SellerProduct }

/** 판매 상태 꼬리표: 판매 중만 자두 */
function StatusTag({ product }: StatusTagProps) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap ${
        isOnSale(product) ? 'bg-signal-soft text-signal' : 'bg-paper-2 text-ink-2'
      }`}
    >
      {PRODUCT_STATUS_LABEL[product.status]}
    </span>
  )
}

type TabCountProps = { tab: SellerProductTab }

/** 탭 옆 전체 개수 (판매자 홈 숫자와 같은 요청이라 캐시를 같이 쓴다) */
function TabCount({ tab }: TabCountProps) {
  const count = useSellerProductCountQuery(tab)
  return <span className="figure text-sm">{count.data ?? ''}</span>
}

const STOCK_TAG = {
  OUT: { label: '품절', className: 'text-destructive' },
  LOW: { label: '재고 적음', className: 'text-ink-2' },
} as const

type StockTagProps = { tag: StockTagValue; href: string }

/** 판매 중 상품의 품절 · 재고 적은 옵션 수. 누르면 상품 상세의 옵션별 재고로 */
function StockTag({ tag, href }: StockTagProps) {
  const { label, className } = STOCK_TAG[tag.kind]
  return (
    <Link
      to={href}
      aria-label={`${label} 옵션 ${tag.count}개 보기`}
      className={`bg-paper-2 hover:bg-paper-3 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap ${className}`}
    >
      {label} {tag.count}
    </Link>
  )
}
