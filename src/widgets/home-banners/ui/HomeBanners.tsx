import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib'
import type { HomeBanner, HomeBannerTone } from '../model/home-banners'

type HomeBannersProps = {
  banners: HomeBanner[]
  /** 사진을 까는 배너에 쓸 사진 주소 */
  photoUrl: string
}

const TONE: Record<HomeBannerTone, string> = {
  sheet: 'bg-sheet text-ink',
  marker: 'bg-marker text-ink',
  ink: 'bg-ink text-paper',
  paper: 'bg-paper text-ink',
}

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
 * 홈 첫 칸의 배너: 넓은 화면은 두 장, 휴대폰은 한 장씩 보이고 좌우로 넘긴다 (끝에서 누르면 처음으로 돌아온다).
 * 손가락으로 밀어도 넘어간다. 한 화면에 다 보이면 넘기는 버튼을 그리지 않는다
 */
export function HomeBanners({ banners, photoUrl }: HomeBannersProps) {
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
            className={cn(
              'group border-ink relative flex min-h-[220px] shrink-0 basis-full snap-start flex-col items-start justify-end gap-1.5 overflow-hidden border-[1.5px] p-5 md:min-h-[clamp(240px,26vw,340px)] md:basis-[calc(50%-0.5rem)] md:p-7',
              TONE[banner.tone],
            )}
          >
            {banner.hasPhoto && (
              <img
                src={photoUrl}
                alt=""
                className="absolute inset-0 size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                fetchPriority="high"
              />
            )}
            {/* 사진 위에서도 읽히게 글자 뒤를 배너 바탕색으로 채운다 */}
            <strong
              className={cn(
                'font-display relative max-w-[85%] px-2 py-0.5 text-[clamp(1.875rem,3.8vw,3.5rem)] leading-[1.08] font-normal [word-break:keep-all]',
                TONE[banner.tone],
              )}
            >
              {banner.title}
            </strong>
            <span
              className={cn(
                'relative max-w-full px-2 py-0.5 text-sm font-medium',
                TONE[banner.tone],
              )}
            >
              {banner.line}
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
