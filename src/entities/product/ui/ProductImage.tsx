import { useState } from 'react'
import { useAppSettings } from '@/shared/config'
import { cn } from '@/shared/lib'
import type { CategoryDoodle } from '../config/category-icons'
import { samplePhotoOf } from '../config/sample-photos'
import { CategoryIcon } from './CategoryIcon'
import placeholder from './product-placeholder.svg'

type ProductImageProps = {
  /** S3 이미지 주소. 없으면 기본 이미지 */
  src: string | null
  alt: string
  className?: string
  /** 쇼핑 목록: 사진이 없으면 시연 데이터가 켜져 있을 때 샘플 사진(Unsplash)을 보여 준다 */
  allowSample?: boolean
  /** 사진이 없을 때 기본 이미지 대신 그릴 낙서 아이콘 (쇼핑 영역). 없으면 기본 이미지 */
  doodle?: CategoryDoodle
}

/** 상품 대표 이미지. 주소가 없거나 불러오지 못하면 (쇼핑 목록이고 시연 데이터가 켜져 있으면 샘플 사진, 아니면) 기본 이미지 */
export function ProductImage({
  src,
  alt,
  className,
  allowSample = false,
  doodle,
}: ProductImageProps) {
  const isMockEnabled = useAppSettings((state) => state.isMockEnabled)
  // 주소가 바뀌면 다시 시도한다 (실패 표시는 그 주소에만 적용)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const sample = allowSample && isMockEnabled ? samplePhotoOf(alt) : null
  const candidate = src ?? sample
  const usable = candidate !== null && candidate !== failedSrc

  if (!usable && doodle)
    return (
      <span
        role="img"
        aria-label={`${alt} (이미지 준비 중)`}
        className={cn('bg-paper-2 text-ink flex w-full items-center justify-center', className)}
      >
        <CategoryIcon icon={doodle} className="size-[46%] max-w-28" />
      </span>
    )

  return (
    <img
      src={usable ? candidate : placeholder}
      alt={usable ? alt : `${alt} (이미지 준비 중)`}
      loading="lazy"
      onError={() => {
        if (usable) setFailedSrc(candidate)
      }}
      className={cn('bg-muted w-full object-cover', className)}
    />
  )
}
