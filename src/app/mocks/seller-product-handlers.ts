import type { SellerProductDetailDto, SellerProductSummaryDto } from '@/entities/product'
import type { MockHandler, MockRequest, Page } from '@/shared/api'
import { fetchReal, page, problem } from './mock-utils'

// 판매자 상품 목록의 상태 · 재고 적음 거르기와 옵션 수 두 칸 (BE #1239 머지 전). 실제 서버의 내 상품 목록을
// 끝까지 읽고 상품마다 상세(옵션 판매 가능 수량 · 판매 여부)로 세어, BE 계약대로 거르고 쪽을 나눈다
const STATUSES = ['SALE_PENDING', 'ON_SALE', 'STOPPED', 'DELISTED']
const LOW_STOCK_MAX = 5
const READ_SIZE = 100

type Row = Omit<SellerProductSummaryDto, 'soldOutOptionCount' | 'lowStockOptionCount'>

async function allProductsOf(request: MockRequest): Promise<Row[]> {
  const rows: Row[] = []
  for (let number = 0; ; number++) {
    const result = await fetchReal<Page<Row>>(
      request,
      `/seller/products?page=${number}&size=${READ_SIZE}`,
    )
    rows.push(...result.content)
    if (!result.hasNext) return rows
  }
}

/** 판매 중 옵션 가운데 수량 0 · 1 ~ 5 (판매 중지 · 보관 옵션은 세지 않는다) */
async function withOptionCounts(request: MockRequest, row: Row): Promise<SellerProductSummaryDto> {
  const detail = await fetchReal<SellerProductDetailDto>(
    request,
    `/seller/products/${row.productId}`,
  )
  const onSale = detail.options.filter((option) => option.saleStatus === 'ON_SALE')
  return {
    ...row,
    soldOutOptionCount: onSale.filter((option) => option.availableQuantity <= 0).length,
    lowStockOptionCount: onSale.filter(
      (option) => option.availableQuantity > 0 && option.availableQuantity <= LOW_STOCK_MAX,
    ).length,
  }
}

export const sellerProductHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/seller/products',
    handle: async (request) => {
      const status = request.query.get('status')
      if (status !== null && !STATUSES.includes(status))
        return problem(
          400,
          '잘못된 요청입니다',
          'status: 판매 상태는 SALE_PENDING · ON_SALE · STOPPED · DELISTED 중 하나입니다.',
          '/api/v1/seller/products',
        )
      const isLowStock = request.query.get('lowStock') === 'true'
      const rows = (await allProductsOf(request)).filter((row) => !status || row.status === status)
      const counted = await Promise.all(rows.map((row) => withOptionCounts(request, row)))
      const content = isLowStock
        ? counted.filter((row) => row.soldOutOptionCount + row.lowStockOptionCount > 0)
        : counted
      return { status: 200, data: page(content, request) }
    },
  },
]
