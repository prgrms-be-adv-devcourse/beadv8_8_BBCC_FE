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
  /**
   * 넓은 화면에서 사진을 자르지 않고 전부 보여 준다. 칸과 비율이 달라 남는 자리에는
   * 같은 사진을 흐리게 키워 깔아 빈 칸으로 보이지 않게 한다 (좁은 화면은 그대로 칸을 채운다)
   */
  showsWhole?: boolean
}

/** 상품 대표 이미지. 주소가 없거나 불러오지 못하면 (쇼핑 목록이고 시연 데이터가 켜져 있으면 샘플 사진, 아니면) 기본 이미지 */
export function ProductImage({
  src,
  alt,
  className,
  allowSample = false,
  doodle,
  showsWhole = false,
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
        <CategoryIcon icon={doodle} className="size-[44%] max-w-44" />
      </span>
    )

  if (usable && showsWhole)
    return (
      <span className={cn('bg-muted relative block w-full overflow-hidden', className)}>
        <img
          src={candidate}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-125 object-cover blur-2xl max-lg:hidden"
        />
        <img
          src={candidate}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(candidate)}
          className="relative size-full object-cover lg:object-contain"
        />
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
