import { paths } from '@/shared/config'

/** 배너 바탕: 분홍 색지 · 형광펜 · 먹 · 종이 */
export type HomeBannerTone = 'sheet' | 'marker' | 'ink' | 'paper'

/** 홈 배너 한 장: 큰 제목 한 줄 · 설명 한 줄 · 누르면 갈 곳 */
export type HomeBanner = {
  id: string
  tone: HomeBannerTone
  title: string
  line: string
  to: string
  /** 사진을 깔 배너 (계절 배너) */
  hasPhoto?: boolean
}

type HomeBannersInput = {
  /** 계절 이름 (seasonOf) */
  season: string
  /** 로그인 전 계절 배너가 갈 로그인 주소 */
  loginHref: string
  isLoggedIn: boolean
  /** 보호자 회원인지 (받은 조르기 · 내 찜은 보호자만 쓴다) */
  isBuyer: boolean
  /** 홈에서 고른 자녀와 그 자녀에게 맞는 사이즈. 없으면 null */
  child: { id: string; name: string; size: number } | null
}

/** 계절 이름: 11~2월 겨울, 3~5월 봄, 6~8월 여름, 9~10월 가을 */
export function seasonOf(month: number): string {
  if (month >= 11 || month <= 2) return 'WINTER'
  if (month <= 5) return 'SPRING'
  if (month <= 8) return 'SUMMER'
  return 'FALL'
}

/** 계절 배너: 자녀를 골랐으면 그 자녀의 맞춤 목록, 아니면 자녀 등록(로그인 전에는 로그인)으로 보낸다 */
function seasonBanner({ season, loginHref, isLoggedIn, child }: HomeBannersInput): HomeBanner {
  const base = { id: 'season', tone: 'paper', hasPhoto: true } as const
  if (child)
    return {
      ...base,
      title: `${season} ${child.size}`,
      line: `${child.name}에게 맞는 옷`,
      to: paths.shop.recommended(child.id),
    }
  return isLoggedIn
    ? { ...base, title: season, line: '자녀 등록하고 맞는 사이즈 보기', to: paths.shop.childNew }
    : { ...base, title: season, line: '로그인하고 맞는 사이즈 보기', to: loginHref }
}

/**
 * 홈 배너 목록. 누르면 갈 곳이 있는 것만 두고 보는 사람에 맞춰 고른다.
 * 문구는 그 화면이 이미 쓰는 문장을 그대로 쓴다 (받은 조르기 · 내 찜 · 판매자 입점)
 */
export function homeBannersOf(input: HomeBannersInput): HomeBanner[] {
  const forBuyer: HomeBanner[] = input.isBuyer
    ? [
        {
          id: 'wishes',
          tone: 'sheet',
          title: '받은 조르기',
          line: '아이가 사 달라고 보낸 상품이에요. 7일 안에 답해 주세요.',
          to: paths.shop.wishes,
        },
        {
          id: 'favorites',
          tone: 'marker',
          title: '내 찜',
          line: '상품 상세에서 하트를 누르면 여기에 모여요.',
          to: paths.shop.favorites,
        },
      ]
    : []
  return [
    seasonBanner(input),
    ...forBuyer,
    {
      id: 'seller',
      tone: 'ink',
      title: '판매자 입점',
      line: '여러 판매자가 직접 상품을 올리고 파는 곳이에요.',
      to: paths.center.apply,
    },
  ]
}
