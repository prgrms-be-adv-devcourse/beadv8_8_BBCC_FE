import { useId, useState } from 'react'
import { cn } from '@/shared/lib'
import { ProductImage } from './ProductImage'

/** 접어 둘 때 설명 글 길이 기준 (상세 사진이 있으면 늘 접는다) */
const LONG_TEXT_LENGTH = 300

type ProductDescriptionProps = {
  /** 판매자가 쓴 설명. 없으면 null */
  description: string | null
  /** 상세 사진 (대표 제외) */
  images: string[]
  alt: string
  /** 처음에 윗부분만 보이고 「상세정보 펼쳐보기」로 펼친다 (리뷰 · 아래 영역까지 스크롤을 줄이려고) */
  isCollapsible?: boolean
}

/** 상품 설명: 설명 글(줄바꿈 그대로) 아래에 상세 사진을 원래 비율로 모두 쌓는다. 둘 다 없으면 그리지 않는다 */
export function ProductDescription({
  description,
  images,
  alt,
  isCollapsible = false,
}: ProductDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const bodyId = useId()
  if (!description && images.length === 0) return null
  const isLong = images.length > 0 || (description?.length ?? 0) > LONG_TEXT_LENGTH
  const isCollapsed = isCollapsible && isLong && !isOpen

  return (
    <section aria-labelledby="product-description" className="space-y-4 border-t pt-6">
      <h2 id="product-description" className="text-lg font-semibold">
        상품 설명
      </h2>
      <div
        id={bodyId}
        className={cn('relative space-y-4', isCollapsed && 'max-h-[28rem] overflow-hidden')}
      >
        {description && (
          <p className="text-sm leading-relaxed whitespace-pre-line">{description}</p>
        )}
        {images.length > 0 && (
          <div className="mx-auto max-w-2xl space-y-2">
            {images.map((src, i) => (
              <ProductImage
                key={src}
                src={src}
                alt={`${alt} 상세 사진 ${i + 1}`}
                className="h-auto"
              />
            ))}
          </div>
        )}
        {isCollapsed && (
          <div
            aria-hidden
            className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t"
          />
        )}
      </div>
      {isCollapsible && isLong && (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={() => setIsOpen((open) => !open)}
          className="border-rule hover:bg-paper-2 flex min-h-11 w-full items-center justify-center rounded-md border text-sm font-semibold transition-colors"
        >
          {isOpen ? '상세정보 접기' : '상세정보 펼쳐보기'}
        </button>
      )}
    </section>
  )
}
