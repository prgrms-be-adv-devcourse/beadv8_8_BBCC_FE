import {
  CATEGORIES,
  type ProductDetailDto,
  type ProductSummaryDto,
  type RegisterProductRequestDto,
  type UpdateProductRequestDto,
} from '@/entities/product'
import type { MockHandler } from '@/shared/api'
import { loadMockState, memberIdOf, page, problem, saveMockState } from './mock-utils'

// 기획서 7.1 시연 데이터: 상품 A(옵션 1 · 2), 상품 B(옵션 3). 옵션 ID는 주문 쪽 상품 복사본과 같아야 담기가 된다
const INITIAL_PRODUCTS: ProductDetailDto[] = [
  {
    productId: '1',
    name: '데일리 맨투맨 (상품 A)',
    categoryId: '1',
    categoryName: '상의',
    sellerId: '2',
    sellerName: '테스트상점',
    status: 'ON_SALE',
    minPrice: 25000,
    thumbnailUrl: null,
    description: '부드러운 면 맨투맨',
    options: [
      {
        optionId: '1',
        color: '네이비',
        material: '면',
        size: '110',
        price: 25000,
        stock: 10,
        minHeightCm: 105,
        maxHeightCm: 115,
        soldOut: false,
      },
      {
        optionId: '2',
        color: '네이비',
        material: '면',
        size: '120',
        price: 25000,
        stock: 10,
        minHeightCm: 115,
        maxHeightCm: 125,
        soldOut: false,
      },
    ],
  },
  {
    productId: '2',
    name: '밴딩 조거 팬츠 (상품 B)',
    categoryId: '2',
    categoryName: '하의',
    sellerId: '2',
    sellerName: '테스트상점',
    status: 'ON_SALE',
    minPrice: 30000,
    thumbnailUrl: null,
    description: '허리 밴딩 조거 팬츠',
    options: [
      {
        optionId: '3',
        color: '그레이',
        material: '면',
        size: '120',
        price: 30000,
        stock: 5,
        minHeightCm: 115,
        maxHeightCm: 125,
        soldOut: false,
      },
    ],
  },
]

export const products: ProductDetailDto[] = loadMockState('products', INITIAL_PRODUCTS)
const save = () => saveMockState('products', products)

let nextProductId = 100 + products.length
let nextOptionId = 100 + products.flatMap((product) => product.options).length

function findMine(productId: string, sellerId: string | null) {
  return products.find((item) => item.productId === productId && item.sellerId === sellerId)
}

function notFound(instance: string) {
  return problem(404, '찾을 수 없습니다', '상품을 찾을 수 없습니다.', instance)
}

export function summaryOf(product: ProductDetailDto): ProductSummaryDto {
  return {
    productId: product.productId,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    status: product.status,
    minPrice: product.minPrice,
    thumbnailUrl: product.thumbnailUrl,
  }
}

export const productHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/products',
    handle: (request) => ({
      status: 200,
      data: page(
        products
          .filter((product) => product.status === 'ON_SALE')
          .filter((product) => {
            const keyword = request.query.get('keyword')
            const categoryId = request.query.get('categoryId')
            return (
              (!keyword || product.name.includes(keyword)) &&
              (!categoryId || product.categoryId === categoryId)
            )
          })
          .map(summaryOf),
        request,
      ),
    }),
  },
  {
    method: 'GET',
    path: '/products/:productId',
    handle: ({ params }) => {
      const product = products.find((item) => item.productId === params.productId)
      return product
        ? { status: 200, data: product }
        : problem(
            404,
            '찾을 수 없습니다',
            '상품을 찾을 수 없습니다.',
            `/api/v1/products/${params.productId}`,
          )
    },
  },
  {
    method: 'GET',
    path: '/seller/products',
    handle: (request) => ({
      status: 200,
      data: page(
        products.filter((product) => product.sellerId === memberIdOf(request)),
        request,
      ),
    }),
  },
  {
    method: 'POST',
    path: '/seller/products',
    handle: (request) => {
      const body = request.body as RegisterProductRequestDto
      const options = body.options.map((option) => ({
        ...option,
        optionId: String(nextOptionId++),
        soldOut: option.stock <= 0,
      }))
      const product: ProductDetailDto = {
        productId: String(nextProductId++),
        name: body.name,
        categoryId: body.categoryId,
        categoryName: CATEGORIES.find((category) => category.id === body.categoryId)?.name ?? '',
        sellerId: memberIdOf(request) ?? '0',
        sellerName: '테스트상점',
        status: 'SALE_PENDING',
        minPrice: Math.min(...options.map((option) => option.price)),
        thumbnailUrl: null,
        description: body.description,
        options,
      }
      products.push(product)
      save()
      return { status: 201, data: product }
    },
  },
  {
    method: 'POST',
    path: '/seller/products/:productId/start-sale',
    handle: ({ params }) => {
      const product = products.find((item) => item.productId === params.productId)
      if (!product) {
        return problem(
          404,
          '찾을 수 없습니다',
          '상품을 찾을 수 없습니다.',
          `/api/v1/seller/products/${params.productId}/start-sale`,
        )
      }
      product.status = 'ON_SALE'
      save()
      return { status: 200, data: product }
    },
  },
  {
    method: 'PATCH',
    path: '/seller/products/:productId',
    handle: (request) => {
      const product = findMine(request.params.productId, memberIdOf(request))
      if (!product) return notFound(`/api/v1/seller/products/${request.params.productId}`)
      const body = request.body as UpdateProductRequestDto
      product.name = body.name
      product.description = body.description
      product.categoryId = body.categoryId
      product.categoryName =
        CATEGORIES.find((category) => category.id === body.categoryId)?.name ?? product.categoryName
      for (const { optionId, price } of body.options) {
        const option = product.options.find((item) => item.optionId === optionId)
        if (option) option.price = price
      }
      product.minPrice = Math.min(...product.options.map((option) => option.price))
      save()
      return { status: 200, data: product }
    },
  },
  {
    method: 'POST',
    path: '/seller/products/:productId/stop-sale',
    handle: (request) => {
      const product = findMine(request.params.productId, memberIdOf(request))
      if (!product) return notFound(`/api/v1/seller/products/${request.params.productId}/stop-sale`)
      product.status = 'STOPPED'
      save()
      return { status: 200, data: product }
    },
  },
  {
    method: 'PATCH',
    path: '/seller/products/:productId/options/:optionId/stock',
    handle: (request) => {
      const instance = `/api/v1/seller/products/${request.params.productId}/options/${request.params.optionId}/stock`
      const product = findMine(request.params.productId, memberIdOf(request))
      const option = product?.options.find((item) => item.optionId === request.params.optionId)
      if (!product || !option) return notFound(instance)
      const { delta } = request.body as { delta: number; reason: string }
      if (option.stock + delta < 0)
        return problem(409, '재고가 부족합니다', '재고는 0보다 적어질 수 없습니다.', instance)
      option.stock += delta
      option.soldOut = option.stock === 0
      save()
      return { status: 200, data: product }
    },
  },
  {
    method: 'POST',
    path: '/admin/products/:productId/stop-sale',
    handle: (request) => {
      const product = products.find((item) => item.productId === request.params.productId)
      if (!product) return notFound(`/api/v1/admin/products/${request.params.productId}/stop-sale`)
      product.status = 'STOPPED'
      save()
      return { status: 200, data: product }
    },
  },
]
