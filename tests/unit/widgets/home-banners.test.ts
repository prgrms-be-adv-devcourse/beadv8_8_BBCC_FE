import { describe, expect, it } from 'vitest'
import { homeBannersOf, seasonOf } from '@/widgets/home-banners'

const GUEST = {
  season: 'WINTER',
  loginHref: '/login?next=%2F',
  isLoggedIn: false,
  isBuyer: false,
  child: null,
}
const idsAndLinks = (input: Parameters<typeof homeBannersOf>[0]) =>
  homeBannersOf(input).map((banner) => [banner.id, banner.to])

describe('seasonOf: 달 → 계절 이름 (11~2월 겨울, 3~5월 봄, 6~8월 여름, 9~10월 가을)', () => {
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

describe('homeBannersOf: 홈 배너는 누르면 갈 곳이 있는 것만, 보는 사람에 맞춰 고른다', () => {
  it('로그인 전: 계절 배너는 로그인으로 가고, 판매자 입점 배너가 따라온다', () => {
    expect(idsAndLinks(GUEST)).toEqual([
      ['season', '/login?next=%2F'],
      ['seller', '/center/apply'],
    ])
    expect(homeBannersOf(GUEST)[0]).toMatchObject({
      title: 'WINTER',
      line: '로그인하고 맞는 사이즈 보기',
    })
  })

  it('자녀가 없는 보호자: 계절 배너는 자녀 등록으로 가고, 받은 조르기 · 내 찜 배너가 더해진다', () => {
    const input = { ...GUEST, isLoggedIn: true, isBuyer: true }
    expect(idsAndLinks(input)).toEqual([
      ['season', '/my/children/new'],
      ['wishes', '/my/wishes'],
      ['favorites', '/my/favorites'],
      ['seller', '/center/apply'],
    ])
    expect(homeBannersOf(input)[0]).toMatchObject({
      title: 'WINTER',
      line: '자녀 등록하고 맞는 사이즈 보기',
    })
  })

  it('자녀를 고른 보호자: 계절 배너에 사이즈를 붙이고 그 자녀의 맞춤 목록으로 간다', () => {
    const input = {
      ...GUEST,
      isLoggedIn: true,
      isBuyer: true,
      child: { id: '7', name: '지호', size: 120 },
    }
    expect(homeBannersOf(input)[0]).toMatchObject({
      id: 'season',
      title: 'WINTER 120',
      line: '지호에게 맞는 옷',
      to: '/recommended/7',
    })
  })

  it('보호자가 아닌 회원은 받은 조르기 · 내 찜 배너를 보지 않는다', () => {
    expect(idsAndLinks({ ...GUEST, isLoggedIn: true })).toEqual([
      ['season', '/my/children/new'],
      ['seller', '/center/apply'],
    ])
  })
})
