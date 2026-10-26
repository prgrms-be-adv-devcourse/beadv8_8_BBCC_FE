import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import {
  canStartSale,
  canStopSale,
  isOnSale,
  PRODUCT_STATUS_LABEL,
  ProductImage,
  stockLevelOf,
  useSellerProductQuery,
  type SellerProductDetail,
  type StockLevel,
} from '@/entities/product'
import { AdjustStockForm, EditProductForm, StopSaleButton } from '@/features/manage-product'
import { StartSaleButton } from '@/features/register-product'
import { ProductImageUploader } from '@/features/upload-product-image'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { paths, sellerPathsOf } from '@/shared/config'
import { formatWon, useArea } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 상품 상세: 판매 상태 · 동작 카드, 옵션별 재고 표. 「수정」을 누르면 같은 자리에 수정 폼 */
export function CenterProductDetailPage() {
  const { productId = '' } = useParams()
  const area = useArea()
  const sellerPaths = sellerPathsOf(area)
  const buyerHref = area === 'console' ? paths.console.product : paths.shop.product
  const product = useSellerProductQuery(productId)
  const [isEditing, setIsEditing] = useState(false)
  const detail = product.data

  return (
    <div className="shop-look max-w-3xl space-y-6">
      <Link
        to={sellerPaths.products}
        className="text-ink-3 hover:text-ink active:text-ink-2 inline-flex min-h-11 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors lg:min-h-0"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        상품 관리
      </Link>
      <PageHeader
        title={detail?.name ?? '상품 상세'}
        step="②"
        description="옵션별 재고를 조정하고, 상품 정보를 수정해요."
        note="상품 하나 · 수정 · 재고 조정 · 판매 시작 · 판매 중지는 모두 실제 API예요. 수정은 등록과 같은 값을 모두 보내는 PUT이고, 읽어 간 version이 다르면 409예요. 옵션 · 판매가 · 실측은 판매 시작 전에만 바꿀 수 있고, 재고는 재고 조정으로 바꿔요. 사진은 브라우저에서 긴 변 2000px JPG로 줄인 뒤, 업로드 주소를 발급받아 S3에 바로 올리고 그 주소를 수정 요청에 담아요."
      />

      {product.isPending && <StateMessage>상품을 불러오는 중…</StateMessage>}
      {product.isError &&
        (getErrorStatus(product.error) === 404 ? (
          <StateMessage>찾을 수 없는 상품이에요.</StateMessage>
        ) : (
          <StateMessage tone="error">{getErrorMessage(product.error)}</StateMessage>
        ))}

      {detail && isEditing && (
        <EditProductForm
          product={detail}
          onDone={() => setIsEditing(false)}
          renderImages={(field) => <ProductImageUploader {...field} />}
        />
      )}

      {detail && !isEditing && (
        <>
          <section className="border-rule rounded-lg border">
            <div className="flex items-start gap-4 p-5">
              {detail.thumbnailUrl && (
                <ProductImage
                  src={detail.thumbnailUrl}
                  alt={detail.name}
                  className="aspect-square size-16 shrink-0 rounded-sm"
                />
              )}
              <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div className="space-y-1">
                  <dt className="text-ink-3 text-[13px]">상태</dt>
                  <dd>
                    <StatusTag product={detail} />
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-ink-3 text-[13px]">상품 번호</dt>
                  <dd className="figure font-bold">#{detail.id}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-ink-3 text-[13px]">옵션</dt>
                  <dd className="figure font-bold">{detail.options.length}개</dd>
                </div>
              </dl>
            </div>
            <div className="border-rule flex flex-wrap items-center gap-2 border-t px-5 py-4">
              {canStopSale(detail) && <StopSaleButton productId={detail.id} />}
              {canStartSale(detail) && <StartSaleButton productId={detail.id} />}
              <Button variant="outline" className="max-lg:h-11" onClick={() => setIsEditing(true)}>
                수정
              </Button>
              {isOnSale(detail) && (
                <Link
                  to={buyerHref(detail.id)}
                  className="shop-link ml-auto inline-flex min-h-8 items-center text-sm max-lg:min-h-11"
                >
                  구매자 화면으로 보기
                </Link>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-section">
              옵션별 재고
              <span className="figure text-ink-3 ml-2 text-sm font-medium">
                {detail.options.length}개
              </span>
            </h2>
            {detail.options.length === 0 ? (
              <StateMessage>옵션이 없어요.</StateMessage>
            ) : (
              <OptionStockTable options={detail.options} />
            )}
          </section>
        </>
      )}
    </div>
  )
}

type OptionStockTableProps = { options: SellerProductDetail['options'] }

/** 옵션 표: 옵션 이름 · 판매가 · 재고 · 꼬리표 · 재고 조정. 휴대폰은 라벨 붙은 묶음으로 다시 쌓는다 */
function OptionStockTable({ options }: OptionStockTableProps) {
  return (
    <table aria-label="옵션별 재고" className="w-full text-sm max-lg:block">
      <thead className="max-lg:sr-only">
        <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
          <th scope="col" className="py-2 pr-4 font-medium">
            옵션 이름
          </th>
          <th scope="col" className="py-2 pr-4 text-right font-medium">
            판매가
          </th>
          <th scope="col" className="py-2 pr-4 text-right font-medium">
            재고
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            <span className="sr-only">재고 상태</span>
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            <span className="sr-only">재고 조정</span>
          </th>
        </tr>
      </thead>
      <tbody className="max-lg:block">
        {options.map((option) => (
          <tr
            key={option.id}
            aria-label={`옵션 ${option.name}`}
            className="border-rule border-b max-lg:grid max-lg:grid-cols-[auto_auto_minmax(0,1fr)] max-lg:items-center max-lg:gap-x-4 max-lg:gap-y-2 max-lg:py-4"
          >
            <td className="py-3 pr-4 align-middle font-semibold max-lg:col-span-3 max-lg:p-0">
              {option.name}
            </td>
            <td className="figure py-3 pr-4 text-right align-middle max-lg:p-0 max-lg:text-left">
              <CellLabel>판매가</CellLabel> {formatWon(option.price)}
            </td>
            <td className="py-3 pr-4 text-right align-middle max-lg:p-0 max-lg:text-left">
              <CellLabel>재고</CellLabel>{' '}
              <span
                className={`figure font-bold ${option.stock === 0 ? 'text-destructive' : 'text-ink'}`}
              >
                {option.stock}
              </span>
            </td>
            <td className="py-3 pr-4 align-middle max-lg:p-0">
              <StockTag stock={option.stock} />
            </td>
            <td className="py-3 text-right align-middle max-lg:col-span-3 max-lg:p-0 max-lg:text-left">
              <AdjustStockForm option={option} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type CellLabelProps = { children: ReactNode }

/** 휴대폰에서만 보이는 칸 이름 (넓은 화면은 표 머리) */
function CellLabel({ children }: CellLabelProps) {
  return <span className="text-ink-3 mr-1 text-[13px] lg:hidden">{children}</span>
}

type StatusTagProps = { product: SellerProductDetail }

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

const STOCK_TAG: Record<StockLevel, { label: string; className: string } | null> = {
  OUT: { label: '품절', className: 'text-destructive' },
  LOW: { label: '재고 적음', className: 'text-ink-2' },
  OK: null,
}

type StockTagProps = { stock: number }

function StockTag({ stock }: StockTagProps) {
  const tag = STOCK_TAG[stockLevelOf(stock)]
  return tag ? (
    <span
      className={`bg-paper-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap ${tag.className}`}
    >
      {tag.label}
    </span>
  ) : null
}
