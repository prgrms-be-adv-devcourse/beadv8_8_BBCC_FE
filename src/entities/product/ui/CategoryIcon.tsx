import { cn } from '@/shared/lib'

type CategoryIconProps = {
  /** 32 × 32 선 그림의 path */
  paths: string[]
  className?: string
}

/** 카테고리 선 아이콘 (글자색을 따른다) */
export function CategoryIcon({ paths, className }: CategoryIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn('size-8', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
