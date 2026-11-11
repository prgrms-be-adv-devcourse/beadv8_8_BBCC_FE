import { GARMENT_PART_SPEC, type GarmentPart } from '@/entities/recommendation'
import { formatDateTime } from '@/shared/lib'
import { Button } from '@/shared/ui/button'

/** 산 옷 한 줄: 채울 수 있는 칸이 없으면 기준 옷으로 쓸 수 없는 옷 */
export type PurchasedGarmentRow = {
  orderItemId: string
  name: string
  size: string
  confirmedAt: string
  parts: GarmentPart[]
}

type PurchasedGarmentPickerProps = {
  rows: PurchasedGarmentRow[]
  hasMore: boolean
  isLoadingMore: boolean
  onMore: () => void
  onPick: (orderItemId: string, part: GarmentPart) => void
}

/** 「산 옷에서 고르기」: 구매확정한 옷 목록. 고르면 그 칸의 편집기를 채운다 */
export function PurchasedGarmentPicker({
  rows,
  hasMore,
  isLoadingMore,
  onMore,
  onPick,
}: PurchasedGarmentPickerProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-[15px] font-semibold">산 옷에서 고르기</h3>
      {rows.length === 0 ? (
        <p className="text-ink-3 text-[13px]">구매확정한 옷이 아직 없어요.</p>
      ) : (
        <ul aria-label="산 옷" className="divide-rule divide-y">
          {rows.map((row) => (
            <li key={row.orderItemId} className="flex flex-wrap items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px]">{row.name}</p>
                <p className="text-ink-3 text-[12px]">
                  {row.size} · {formatDateTime(row.confirmedAt)} 구매확정
                </p>
              </div>
              {row.parts.length === 0 ? (
                <span className="text-ink-3 text-[12px]">기준 옷으로 쓸 수 없는 옷</span>
              ) : (
                row.parts.map((part) => (
                  <Button
                    key={part}
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={`${row.name} ${row.size} ${GARMENT_PART_SPEC[part].label} 칸에 채우기`}
                    onClick={() => onPick(row.orderItemId, part)}
                  >
                    {GARMENT_PART_SPEC[part].label} 칸에
                  </Button>
                ))
              )}
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <Button type="button" variant="outline" disabled={isLoadingMore} onClick={onMore}>
          {isLoadingMore ? '불러오는 중…' : '더 보기'}
        </Button>
      )}
    </div>
  )
}
