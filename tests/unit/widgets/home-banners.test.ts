import { describe, expect, it } from 'vitest'
import { homeBannersOf, seasonOf } from '@/widgets/home-banners'

const product = (id: string, imageUrl: string | null = `https://img/${id}.jpg`) => ({
  id,
  name: `상품 ${id}`,
  imageUrl,
  businessName: `상점 ${id}`,
})
const GUEST = {
  season: 'WINTER' as const,
  loginHref: '/login?next=%2F',
  isLoggedIn: false,
  child: null,
  products: [product('1'), product('2'), product('3'), product('4'), product('5')],
}

describe('seasonOf: 달 → 계절 (11~2월 겨울, 3~5월 봄, 6~8월 여름, 9~10월 가을)', () => {
  it.each([
    [11, 'WINTER'],
    [2, 'WINTER'],
    [3, 'SPRING'],
    [5, 'SPRING'],
    [6, 'SUMMER'],
    [8, 'SUMMER'],
    [9, 'FALL'],
    [10, 'FALL'],
  ])('%i월은 %s', (month, expected) => {
    expect(seasonOf(month)).toBe(expected)
  })
})

describe('homeBannersOf: 첫 장은 맞춤 안내, 나머지는 실제 상품 사진 배너', () => {
  it('로그인 전: 첫 장은 로그인으로 가고, 뒤 세 장은 상품 상세로 간다 (모두 네 장)', () => {
    const banners = homeBannersOf(GUEST)
    expect(banners.map((banner) => [banner.id, banner.to])).toEqual([
      ['fit', '/login?next=%2F'],
      ['product-2', '/products/2'],
      ['product-3', '/products/3'],
      ['product-4', '/products/4'],
    ])
    expect(banners[0].caption).toBe('로그인하고 시작하기')
  })

  it('자녀가 없는 회원: 첫 장은 자녀 등록으로 간다', () => {
    expect(homeBannersOf({ ...GUEST, isLoggedIn: true })[0]).toMatchObject({
      to: '/my/children/new',
      caption: '자녀 등록하기',
    })
  })

  it('자녀를 고른 보호자: 첫 장에 이름과 사이즈를 넣고 그 자녀의 맞춤 목록으로 간다', () => {
    const banners = homeBannersOf({
      ...GUEST,
      isLoggedIn: true,
      child: { id: '7', name: '지호', size: 120 },
    })
    expect(banners[0]).toMatchObject({
      lines: ['지호에게 딱 맞는 120', '맞는 옷만 모았어요'],
      caption: '맞춤 상품 보기',
      to: '/recommended/7',
    })
    // 상품 배너도 그 자녀를 실어 보낸다 (상세에서 추천 사이즈가 바로 보인다)
    expect(banners[1].to).toBe('/products/2?childId=7')
  })

  it('상품 배너는 그 상품의 사진 · 상점 이름을 쓰고, 계절 문구 두 줄을 얹는다', () => {
    const [fit, first] = homeBannersOf(GUEST)
    // 첫 장은 맨 앞 상품의 사진을 빌린다
    expect(fit.imageUrl).toBe('https://img/1.jpg')
    expect(first).toMatchObject({ imageUrl: 'https://img/2.jpg', caption: '상점 2' })
    expect(first.lines).toHaveLength(2)
    expect(first.lines.every((line) => line.length > 0)).toBe(true)
  })

  it('사진이 있는 상품을 먼저 쓴다', () => {
    const banners = homeBannersOf({
      ...GUEST,
      products: [product('1', null), product('2'), product('3', null), product('4')],
    })
    expect(banners.map((banner) => banner.imageUrl)).toEqual([
      'https://img/2.jpg',
      'https://img/4.jpg',
      null,
      null,
    ])
  })

  it.each([
    [0, ['fit']],
    [1, ['fit']],
    [2, ['fit', 'product-2']],
  ])('상품이 %i개면 배너는 %j', (count, expected) => {
    const products = GUEST.products.slice(0, count)
    expect(homeBannersOf({ ...GUEST, products }).map((banner) => banner.id)).toEqual(expected)
  })

  it.each(['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const)(
    '%s에도 상품 배너 세 장의 문구가 서로 다르다',
    (season) => {
      const titles = homeBannersOf({ ...GUEST, season })
        .slice(1)
        .map((banner) => banner.lines.join(' '))
      expect(new Set(titles).size).toBe(3)
    },
  )
})
