import { cn } from '@/shared/lib'
import { FIT_LABEL, type SizeRange } from '../model/recommendation'

type SizeFitChartProps = {
  sizes: SizeRange[]
  recommendedSize: string | null
  child: { name: string; heightCm: number }
}

const PADDING_CM = 4

/** 사이즈마다 권장 키 범위를 막대로, 자녀 키를 세로선으로 겹쳐 그린다 (어느 사이즈에 드는지 한눈에) */
export function SizeFitChart({ sizes, recommendedSize, child }: SizeFitChartProps) {
  if (sizes.length === 0) return null
  const low = Math.min(child.heightCm, ...sizes.map((item) => item.minHeightCm)) - PADDING_CM
  const high = Math.max(child.heightCm, ...sizes.map((item) => item.maxHeightCm)) + PADDING_CM
  const percent = (cm: number) => `${((cm - low) / (high - low)) * 100}%`
  const sorted = [...sizes].sort((a, b) => a.minHeightCm - b.minHeightCm)

  return (
    <figure
      role="img"
      aria-label={`${child.name} 키 ${child.heightCm}cm와 사이즈별 권장 키: ${sorted
        .map((item) => `${item.size} ${item.minHeightCm}~${item.maxHeightCm}cm`)
        .join(', ')}`}
      className="space-y-1"
    >
      <div className="relative space-y-1.5 pt-5">
        {/* 자녀 키 세로선 */}
        <div
          aria-hidden
          className="bg-primary absolute top-0 bottom-0 w-0.5"
          style={{
            left: `calc(2.75rem + (100% - 2.75rem) * ${(child.heightCm - low) / (high - low)})`,
          }}
        >
          <span className="bg-primary text-primary-foreground absolute -top-0.5 left-1/2 -translate-x-1/2 rounded px-1.5 text-[11px] font-semibold whitespace-nowrap">
            {child.name} {child.heightCm}cm
          </span>
        </div>
        {sorted.map((item) => {
          const recommended = item.size === recommendedSize
          return (
            <div key={item.size} className="flex items-center text-xs">
              <span className={cn('w-11 shrink-0', recommended && 'font-bold')}>{item.size}</span>
              <div className="bg-muted/60 relative h-6 flex-1 rounded">
                <div
                  className={cn(
                    'absolute inset-y-0 flex items-center justify-center rounded px-1 text-[11px] whitespace-nowrap',
                    recommended
                      ? 'bg-highlight text-foreground font-semibold'
                      : 'bg-primary/15 text-muted-foreground',
                  )}
                  style={{
                    left: percent(item.minHeightCm),
                    width: `calc(${percent(item.maxHeightCm)} - ${percent(item.minHeightCm)})`,
                  }}
                >
                  {item.minHeightCm}~{item.maxHeightCm}
                  {recommended && item.fit && ` · ${FIT_LABEL[item.fit]}`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <figcaption className="text-muted-foreground pl-11 text-[11px]">
        막대 = 사이즈별 권장 키(cm), 세로선 = 자녀 키
      </figcaption>
    </figure>
  )
}
