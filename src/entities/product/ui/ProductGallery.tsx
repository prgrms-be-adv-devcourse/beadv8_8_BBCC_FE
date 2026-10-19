import { useRef, useState } from 'react'
import { cn } from '@/shared/lib'
import { galleryIndexOf } from '../model/product.rules'
import { ProductImage } from './ProductImage'

type ProductGalleryProps = {
  /** 대표 → 상세 순서. 없으면 기본 이미지 한 장 */
  images: string[]
  alt: string
  className?: string
}

/** 상품 사진: 큰 사진은 좌우로 밀어 넘기고(scroll-snap), 작은 사진 줄을 누르면 그 사진으로 간다 */
export function ProductGallery({ images, alt, className }: ProductGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  if (images.length <= 1) {
    return (
      <ProductImage src={images[0] ?? null} alt={alt} className={cn('aspect-square', className)} />
    )
  }

  const scrollToIndex = (next: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (track) setIndex(galleryIndexOf(track.scrollLeft, track.clientWidth, images.length))
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          role="group"
          aria-label={`${alt} 사진 ${images.length}장`}
          className={cn(
            'flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto',
            className,
          )}
        >
          {images.map((src, i) => (
            <ProductImage
              key={src}
              src={src}
              alt={`${alt} 사진 ${i + 1}`}
              className="aspect-square shrink-0 snap-center"
            />
          ))}
        </div>
        <GalleryArrow
          direction="prev"
          disabled={index === 0}
          onClick={() => scrollToIndex(index - 1)}
        />
        <GalleryArrow
          direction="next"
          disabled={index === images.length - 1}
          onClick={() => scrollToIndex(index + 1)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`사진 ${i + 1} 보기`}
            aria-current={i === index}
            onClick={() => scrollToIndex(i)}
            className={cn(
              'size-14 shrink-0 overflow-hidden rounded-lg border-2 md:size-16',
              i === index ? 'border-primary' : 'border-transparent',
            )}
          >
            <ProductImage src={src} alt="" className="size-full" />
          </button>
        ))}
      </div>
    </div>
  )
}

type GalleryArrowProps = {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}

/** PC(마우스)용 이전 · 다음 버튼. 휴대폰은 손가락으로 밀어 넘긴다 */
function GalleryArrow({ direction, disabled, onClick }: GalleryArrowProps) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      aria-label={isPrev ? '이전 사진' : '다음 사진'}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow disabled:opacity-0 md:flex',
        isPrev ? 'left-2' : 'right-2',
      )}
    >
      {isPrev ? '‹' : '›'}
    </button>
  )
}
