import type {
  ProductDetailDto,
  ProductStatus,
  ProductSummaryDto,
  RegisterProductRequestDto,
  RegisterProductResultDto,
  SaleStatusResultDto,
  SellerProductDto,
  UpdateProductRequestDto,
} from '@/entities/product'
import type { MockHandler, MockObserver, MockRequest } from '@/shared/api'
import { getErrorStatus } from '@/shared/api'
import { fetchReal, loadMockState, memberIdOf, page, problem, saveMockState } from './mock-utils'

// 상품 등록 · 상세 · 판매 시작 · 카테고리는 실제 API다.
// BE에 아직 없는 목록 · 판매자 목록 · 수정 · 판매 중지 · 재고 조정만 목으로 응답한다.
// 목 목록은 이 탭에서 실제로 등록 · 판매 시작한 상품을 옮겨 적어 만든다 (아래 관찰자).

type StoredProduct = {
  productId: string
  /** 등록한 판매자 (토큰 sub). 모르면 null */
  sellerId: string | null
  name: string
  brand: string | null
  categoryId: string
  imageUrls: string[]
  /** 실제 상태 (등록 · 판매 시작 응답) */
  status: ProductStatus
  /** 목 판매 중지 (판매자 · 관리자). 실제로 판매 시작하면 풀린다 */
  stopped: boolean
  options: { optionId: string; optionName: string; price: number; stock: number | null }[]
  /**
   * 시연 데이터 ID(기획서 7.1 상품 A · B). 실제 서버에 있을 때만 목록에 보인다 (상세를 불러 확인).
   * 그 밖의 상품은 이 탭에서 등록했으니 있다고 본다
   */
  seeded?: boolean
  /** 목 수정으로 이름을 바꿨는지 */
  renamed?: boolean
}

const SEEDED: StoredProduct[] = [
  {
    productId: '1',
    sellerId: '2',
    name: '데일리 맨투맨 (상품 A)',
    brand: null,
    categoryId: '',
    imageUrls: [],
    status: 'ON_SALE',
    stopped: false,
    options: [],
    seeded: true,
  },
  {
    productId: '2',
    sellerId: '2',
    name: '밴딩 조거 팬츠 (상품 B)',
    brand: null,
    categoryId: '',
    imageUrls: [],
    status: 'ON_SALE',
    stopped: false,
    options: [],
    seeded: true,
  },
]

const products: StoredProduct[] = loadMockState('products.v2', SEEDED)
const save = () => saveMockState('products.v2', products)

const statusOf = (product: StoredProduct): ProductStatus =>
  product.stopped ? 'STOPPED' : product.status

/** 실제 상세. 없거나 판매 시작 전이면 null */
async function loadDetail(request: MockRequest, productId: string) {
  try {
    return await fetchReal<ProductDetailDto>(request, `/products/${productId}`)
  } catch (error) {
    if (getErrorStatus(error) === 404) return null
    throw error
  }
}

/** 판매 중인 상품의 실제 상세. 시연 데이터 ID는 실제 서버에 없으면 뺀다 */
export async function loadOnSaleDetails(request: MockRequest): Promise<ProductDetailDto[]> {
  const details = await Promise.all(
    products
      .filter((product) => statusOf(product) === 'ON_SALE')
      .map((product) => loadDetail(request, product.productId)),
  )
  return details.filter((detail): detail is ProductDetailDto => detail !== null)
}

/** 목 수정 · 재고를 실제 상세에 덧씌운다 */
function merge(product: StoredProduct, detail: ProductDetailDto | null): SellerProductDto {
  const options = detail
    ? detail.options.map((option) => {
        const stored = product.options.find((item) => item.optionId === option.optionId)
        return {
          optionId: option.optionId,
          optionName: option.optionName,
          price: stored?.price ?? option.price,
          stock: stored?.stock ?? (option.stockStatus === 'SOLD_OUT' ? 0 : option.stockQuantity),
        }
      })
    : product.options
  const prices = options.map((option) => option.price)
  return {
    productId: product.productId,
    // 이름은 등록 · 목 수정 값 (실제 상세에는 목 수정이 반영되지 않는다).
    // 시연 데이터 ID는 실제 서버의 그 ID 상품이 무엇이든 실제 이름을 쓴다 (목 수정 전까지)
    name: product.seeded && detail && !product.renamed ? detail.name : product.name,
    brand: detail?.brand ?? product.brand,
    categoryId: detail?.categoryId ?? product.categoryId,
    status: statusOf(product),
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    thumbnailUrl: (detail?.imageUrls ?? product.imageUrls)[0] ?? null,
    options,
  }
}

async function listed(request: MockRequest, list: StoredProduct[]): Promise<SellerProductDto[]> {
  const rows = await Promise.all(
    list.map(async (product) => {
      // 판매 시작 전 상품은 상세가 404라 등록 응답으로 보여 준다
      const detail =
        product.status === 'SALE_PENDING' ? null : await loadDetail(request, product.productId)
      if (product.seeded && !detail) return null
      return merge(product, detail)
    }),
  )
  return rows.filter((row): row is SellerProductDto => row !== null)
}

const summaryOf = (row: SellerProductDto): ProductSummaryDto => ({
  productId: row.productId,
  name: row.name,
  brand: row.brand,
  categoryId: row.categoryId,
  status: row.status,
  minPrice: row.minPrice,
  thumbnailUrl: row.thumbnailUrl,
})

function findMine(request: MockRequest) {
  const sellerId = memberIdOf(request)
  return products.find(
    (item) => item.productId === request.params.productId && item.sellerId === sellerId,
  )
}

function notFound(instance: string) {
  return problem(404, '찾을 수 없습니다', '상품을 찾을 수 없습니다.', instance)
}

export const productHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/products',
    handle: async (request) => {
      const keyword = request.query.get('keyword')
      const categoryId = request.query.get('categoryId')
      const rows = await listed(
        request,
        products.filter((product) => statusOf(product) === 'ON_SALE'),
      )
      return {
        status: 200,
        data: page(
          rows
            .filter(
              (row) =>
                (!keyword || row.name.includes(keyword)) &&
                (!categoryId || row.categoryId === categoryId),
            )
            .map(summaryOf),
          request,
        ),
      }
    },
  },
  {
    method: 'GET',
    path: '/seller/products',
    handle: async (request) => ({
      status: 200,
      data: page(
        await listed(
          request,
          products.filter((product) => product.sellerId === memberIdOf(request)),
        ),
        request,
      ),
    }),
  },
  {
    method: 'PATCH',
    path: '/seller/products/:productId',
    handle: async (request) => {
      const product = findMine(request)
      if (!product) return notFound(`/api/v1/seller/products/${request.params.productId}`)
      const body = request.body as UpdateProductRequestDto
      product.name = body.name
      product.renamed = true
      for (const { optionId, price } of body.options) {
        const option = product.options.find((item) => item.optionId === optionId)
        if (option) option.price = price
        else product.options.push({ optionId, optionName: '', price, stock: null })
      }
      save()
      return { status: 200 }
    },
  },
  {
    method: 'POST',
    path: '/seller/products/:productId/stop-sale',
    handle: (request) => {
      const product = findMine(request)
      if (!product) return notFound(`/api/v1/seller/products/${request.params.productId}/stop-sale`)
      product.stopped = true
      save()
      return { status: 200 }
    },
  },
  {
    method: 'PATCH',
    path: '/seller/products/:productId/options/:optionId/stock',
    handle: (request) => {
      const instance = `/api/v1/seller/products/${request.params.productId}/options/${request.params.optionId}/stock`
      const product = findMine(request)
      const option = product?.options.find((item) => item.optionId === request.params.optionId)
      if (!product || !option) return notFound(instance)
      const { delta } = request.body as { delta: number; reason: string }
      const current = option.stock ?? 0
      if (current + delta < 0)
        return problem(409, '재고가 부족합니다', '재고는 0보다 적어질 수 없습니다.', instance)
      option.stock = current + delta
      save()
      return { status: 200 }
    },
  },
  {
    method: 'POST',
    path: '/admin/products/:productId/stop-sale',
    handle: (request) => {
      const product = products.find((item) => item.productId === request.params.productId)
      if (!product) return notFound(`/api/v1/admin/products/${request.params.productId}/stop-sale`)
      product.stopped = true
      save()
      return { status: 200 }
    },
  },
]

/** 실제 등록 · 판매 시작 응답을 목 목록에 옮겨 적는다 */
export const productObservers: MockObserver[] = [
  {
    method: 'POST',
    path: '/seller/products',
    observe: (request, response) => {
      const body = request.body as RegisterProductRequestDto
      const result = response.data as RegisterProductResultDto
      products.push({
        productId: result.productId,
        sellerId: memberIdOf(request),
        name: body.name,
        brand: body.brand,
        categoryId: String(body.categoryId),
        imageUrls: body.imageUrls,
        status: result.status as ProductStatus,
        stopped: false,
        options: result.options.map((option) => ({
          optionId: option.optionId,
          optionName: option.optionName,
          price: option.price,
          stock: option.availableQuantity,
        })),
      })
      save()
    },
  },
  {
    method: 'PUT',
    path: '/seller/products/:productId/sale-status',
    observe: (request, response) => {
      const result = response.data as SaleStatusResultDto
      const product = products.find((item) => item.productId === request.params.productId)
      if (!product) return
      product.status = result.status as ProductStatus
      product.stopped = false
      save()
    },
  },
]
