import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ALL_CATEGORIES_ICON, ProductImage } from '@/entities/product'
import type { HomeBanner } from '../model/home-banners.rules'

type HomeBannersProps = { banners: HomeBanner[] }

const NAV_BUTTON =
  'border-ink hover:bg-marker flex h-9 w-10 items-center justify-center border-[1.5px] text-[15px]'

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
 * 넓은 화면은 세 장(그보다 적으면 폭을 나눠 채운다), 휴대폰은 한 장씩 보이고 좌우로 넘긴다 (끝에서 누르면 처음으로 돌아온다).
 * 손가락으로 밀어도 넘어간다. 한 화면에 다 보이면 넘기는 버튼을 그리지 않는다
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
    <section aria-label="바로가기 배너" className="space-y-2.5">
      <div
        ref={trackRef}
        onScroll={(event) => {
          const next = positionOf(event.currentTarget)
          if (next) setPosition(next)
        }}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.to}
            className="group border-ink bg-paper-2 relative aspect-[4/5] shrink-0 basis-full snap-start overflow-hidden border-[1.5px] md:aspect-auto md:h-[clamp(320px,36vw,460px)] md:grow md:basis-[calc((100%-2rem)/3)]"
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
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="이전 배너"
            className={NAV_BUTTON}
            onClick={() => move(-1)}
          >
            ←
          </button>
          <span className="border-ink figure flex h-9 items-center border-y-[1.5px] px-3.5 text-sm font-bold">
            {position.index + 1} / {position.last + 1}
          </span>
          <button
            type="button"
            aria-label="다음 배너"
            className={NAV_BUTTON}
            onClick={() => move(1)}
          >
            →
          </button>
        </div>
      )}
    </section>
  )
}
