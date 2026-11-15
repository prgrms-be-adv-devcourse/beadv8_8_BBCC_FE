import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ALL_CATEGORIES_ICON, ProductImage } from '@/entities/product'
import type { HomeBanner } from '../model/home-banners.rules'

type HomeBannersProps = { banners: HomeBanner[] }

// 사진 위 양옆 가운데에 뜨는 둥근 버튼. 휴대폰은 손가락으로 밀므로 그리지 않는다
const NAV_BUTTON =
  'bg-paper text-ink hover:bg-marker absolute top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_1px_6px_rgb(0_0_0/0.25)] max-md:hidden'

function NavArrow({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={direction === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

/** 배너 한 장 너비 + 사이 간격 */
function stepOf(track: HTMLElement): number {
  const first = track.firstElementChild
  return first instanceof HTMLElement
    ? first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0')
    : 0
}

/** 지금 몇 번째인지와 끝까지 몇 번 넘길 수 있는지. 아직 크기를 모르면 null */
function positionOf(track: HTMLElement): { index: number; last: number } | null {
  const step = stepOf(track)
  if (step === 0) return null
  return {
    index: Math.round(track.scrollLeft / step),
    last: Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / step)),
  }
}

/**
 * 홈 첫 칸의 배너: 사진이 칸을 가득 채우고 아래쪽에 문구 두 줄과 작은 글자 한 줄을 얹는다.
 * 본문 폭을 벗어나 화면 끝까지 넓힌다 (스크롤 막대만큼 넘치는 폭은 쇼핑 레이아웃이 잘라 낸다).
 * 넓은 화면은 세 장을 간격 없이 이어 붙이고(그보다 적으면 폭을 나눠 채운다) 더 있으면 사진 위 양옆의 버튼으로 넘긴다 (끝에서 누르면 처음으로).
 * 휴대폰은 다음 장이 오른쪽에 조금 보이고 손가락으로 밀어 넘긴다 (버튼 없음)
 */
export function HomeBanners({ banners }: HomeBannersProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ index: 0, last: 0 })

  // 크기가 정해질 때 · 바뀔 때 몇 번 넘길 수 있는지 다시 잰다
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(() => setPosition((prev) => positionOf(track) ?? prev))
    observer.observe(track)
    return () => observer.disconnect()
  }, [banners.length])

  const move = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const next = position.index + direction
    const target = next > position.last ? 0 : next < 0 ? position.last : next
    track.scrollTo({ left: target * stepOf(track) })
  }

  return (
    <section aria-label="바로가기 배너" className="relative mx-[calc(50%-50vw)] -mt-6 md:-mt-8">
      <div
        ref={trackRef}
        onScroll={(event) => {
          const next = positionOf(event.currentTarget)
          if (next) setPosition(next)
        }}
        className="flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-2 overflow-x-auto px-4 motion-safe:scroll-smooth md:scroll-px-0 md:gap-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.to}
            className="group bg-paper-2 relative aspect-[4/5] shrink-0 basis-[86%] snap-start overflow-hidden md:aspect-auto md:h-[clamp(400px,40vw,620px)] md:grow md:basis-1/3"
          >
            <ProductImage
              src={banner.imageUrl}
              alt={banner.alt}
              allowSample
              doodle={ALL_CATEGORIES_ICON}
              className="absolute inset-0 h-full transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
            />
            {/* 사진 위 글자가 읽히게 아래쪽만 어둡게 누른다 */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
            />
            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 text-white md:p-6">
              <strong className="font-display text-[clamp(1.5rem,2vw,1.875rem)] leading-[1.25] font-normal [word-break:keep-all]">
                {banner.lines[0]}
                <br />
                {banner.lines[1]}
              </strong>
              <span className="text-[13px] font-bold underline-offset-[3px] group-hover:underline">
                {banner.caption}
              </span>
            </span>
          </Link>
        ))}
      </div>
      {position.last > 0 && (
        <>
          <button
            type="button"
            aria-label="이전 배너"
            className={`${NAV_BUTTON} left-4`}
            onClick={() => move(-1)}
          >
            <NavArrow direction="prev" />
          </button>
          <button
            type="button"
            aria-label="다음 배너"
            className={`${NAV_BUTTON} right-4`}
            onClick={() => move(1)}
          >
            <NavArrow direction="next" />
          </button>
        </>
      )}
    </section>
  )
}
