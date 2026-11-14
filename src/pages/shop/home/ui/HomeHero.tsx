import { HOME_HERO_PHOTO } from '@/entities/product'

type HomeHeroProps = {
  /** 고른 자녀에게 맞는 사이즈. 자녀가 없으면 null (계절 이름만) */
  size: number | null
}

/** 계절 이름: 11~2월 겨울, 3~5월 봄, 6~8월 여름, 9~10월 가을 */
function seasonOf(month: number): string {
  if (month >= 11 || month <= 2) return 'WINTER'
  if (month <= 5) return 'SPRING'
  if (month <= 8) return 'SUMMER'
  return 'FALL'
}

/** 홈 첫 칸: 큰 계절 이름 + 형광펜을 그은 우리 아이 사이즈, 옆에 먹색 테두리 사진 (Unsplash) */
export function HomeHero({ size }: HomeHeroProps) {
  const season = seasonOf(new Date().getMonth() + 1)
  return (
    <section
      aria-label={size ? `${season} ${size} 사이즈` : season}
      className="flex flex-col gap-5 pt-2 md:flex-row md:items-end md:gap-8 md:pt-6"
    >
      <p
        aria-hidden
        className="font-display text-ink shrink-0 text-6xl leading-[0.95] tracking-[-0.04em] md:text-[88px]"
      >
        {season}
        {size && (
          <>
            <br />
            <span className="bg-[linear-gradient(transparent_55%,var(--fit)_55%)] px-[0.06em]">
              {size}
            </span>
          </>
        )}
      </p>
      <div className="border-ink bg-paper-2 relative h-44 w-full min-w-0 overflow-hidden border-[1.5px] md:h-60 md:flex-1">
        <img
          src={HOME_HERO_PHOTO}
          alt=""
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
        />
      </div>
    </section>
  )
}
