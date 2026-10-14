import {
  CATEGORIES,
  type ProductDetail,
  type ProductOption,
  type ProductSummary,
} from '@/entities/product'
import type { MockHandler } from '@/shared/api'
import { loadMockState, memberIdOf, page, problem, saveMockState } from './mock-utils'

// 기획서 7.1 시연 데이터: 상품 A(옵션 1 · 2), 상품 B(옵션 3). 옵션 ID는 주문 쪽 상품 복사본과 같아야 담기가 된다
const INITIAL_PRODUCTS: ProductDetail[] = [
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

export const products: ProductDetail[] = loadMockState('products', INITIAL_PRODUCTS)
const save = () => saveMockState('products', products)

let nextProductId = 100 + products.length
let nextOptionId = 100 + products.flatMap((product) => product.options).length

type RegisterRequest = {
  name: string
  categoryId: string
  description: string
  options: Omit<ProductOption, 'optionId' | 'soldOut'>[]
}

export function summaryOf(product: ProductDetail): ProductSummary {
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
        products.filter((product) => product.status === 'ON_SALE').map(summaryOf),
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
      const body = request.body as RegisterRequest
      const options = body.options.map((option) => ({
        ...option,
        optionId: String(nextOptionId++),
        soldOut: option.stock <= 0,
      }))
      const product: ProductDetail = {
        productId: String(nextProductId++),
        name: body.name,
        categoryId: body.categoryId,
        categoryName:
          CATEGORIES.find((category) => category.categoryId === body.categoryId)?.name ?? '',
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
]
