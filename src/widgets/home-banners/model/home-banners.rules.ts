import { paths } from '@/shared/config'
import { SEASON_COPY, type Season } from '../config/season-copy'

/** 홈 배너 한 장: 사진 위에 문구 두 줄과 작은 글자 한 줄. 누르면 to로 간다 */
export type HomeBanner = {
  id: string
  lines: [string, string]
  /** 문구 아래 작은 글자 (상품 배너는 상점 이름) */
  caption: string
  to: string
  /** 깔 사진. 없으면 낙서 아이콘 */
  imageUrl: string | null
  /** 사진을 읽어 줄 이름 */
  alt: string
}

/** 배너에 쓰는 상품 값 (상품 목록 한 칸에서 고른 것) */
export type BannerProduct = {
  id: string
  name: string
  imageUrl: string | null
  businessName: string | null
}

type HomeBannersInput = {
  season: Season
  /** 로그인 전 첫 장이 갈 로그인 주소 */
  loginHref: string
  isLoggedIn: boolean
  /** 홈에서 고른 자녀와 그 자녀에게 맞는 사이즈. 없으면 null */
  child: { id: string; name: string; size: number } | null
  /** 판매 중인 상품 (새로 올라온 순서) */
  products: BannerProduct[]
}

/** 상품 배너 수 (첫 장 맞춤 안내를 더해 모두 네 장까지) */
const PRODUCT_BANNERS = 3

/** 계절: 11~2월 겨울, 3~5월 봄, 6~8월 여름, 9~10월 가을 */
export function seasonOf(month: number): Season {
  if (month >= 11 || month <= 2) return 'WINTER'
  if (month <= 5) return 'SPRING'
  if (month <= 8) return 'SUMMER'
  return 'FALL'
}

/** 첫 장의 문구와 갈 곳: 자녀를 골랐으면 맞춤 목록, 아니면 자녀 등록(로그인 전에는 로그인) */
function fitCopyOf({ loginHref, isLoggedIn, child }: HomeBannersInput) {
  if (child)
    return {
      lines: [`${child.name}에게 딱 맞는 ${child.size}`, '맞는 옷만 모았어요'] as [string, string],
      caption: '맞춤 상품 보기',
      to: paths.shop.recommended(child.id),
    }
  const lines: [string, string] = ['키만 알려 주세요', '맞는 사이즈 찾아 드려요']
  return isLoggedIn
    ? { lines, caption: '자녀 등록하기', to: paths.shop.childNew }
    : { lines, caption: '로그인하고 시작하기', to: loginHref }
}

/**
 * 홈 배너 목록: 첫 장은 맞춤 안내(맨 앞 상품의 사진을 빌린다), 뒤는 실제 상품 사진 배너 세 장까지.
 * 사진이 있는 상품을 먼저 쓰고, 상품 배너는 누르면 그 상품으로 간다 (자녀를 골랐으면 실어 보낸다)
 */
export function homeBannersOf(input: HomeBannersInput): HomeBanner[] {
  const sorted = [
    ...input.products.filter((product) => product.imageUrl),
    ...input.products.filter((product) => !product.imageUrl),
  ]
  const [lead, ...rest] = sorted
  const fit: HomeBanner = {
    id: 'fit',
    ...fitCopyOf(input),
    imageUrl: lead?.imageUrl ?? null,
    alt: lead?.name ?? '',
  }
  const copies = SEASON_COPY[input.season]
  return [
    fit,
    ...rest.slice(0, PRODUCT_BANNERS).map((product, index) => ({
      id: `product-${product.id}`,
      lines: copies[index],
      caption: product.businessName ?? product.name,
      to: paths.shop.product(product.id, input.child?.id),
      imageUrl: product.imageUrl,
      alt: product.name,
    })),
  ]
}
