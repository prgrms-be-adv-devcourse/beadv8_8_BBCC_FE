import { useState } from 'react'
import { cn } from '@/shared/lib'
import placeholder from './product-placeholder.svg'

type ProductImageProps = {
  /** S3 이미지 주소. 없으면 기본 이미지 */
  src: string | null
  alt: string
  className?: string
}

/** 상품 대표 이미지. 주소가 없거나 불러오지 못하면 기본 이미지를 보여 준다 */
export function ProductImage({ src, alt, className }: ProductImageProps) {
  // 주소가 바뀌면 다시 시도한다 (실패 표시는 그 주소에만 적용)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const usable = src !== null && src !== failedSrc

  return (
    <img
      src={usable ? src : placeholder}
      alt={usable ? alt : `${alt} (이미지 준비 중)`}
      loading="lazy"
      onError={() => {
        if (usable) setFailedSrc(src)
      }}
      className={cn('bg-muted w-full object-cover', className)}
    />
  )
}
