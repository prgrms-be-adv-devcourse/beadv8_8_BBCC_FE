import { useState } from 'react'
import {
  STOCK_REASON_LABEL,
  validateStockAdjustment,
  type ProductOption,
  type StockReason,
} from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useAdjustStock } from '../model/use-manage-product'

type AdjustStockFormProps = {
  productId: string
  option: ProductOption
}

/** 옵션 한 줄의 재고 조정: 증감 수량 + 사유 */
export function AdjustStockForm({ productId, option }: AdjustStockFormProps) {
  const adjust = useAdjustStock(productId, option.id)
  const [open, setOpen] = useState(false)
  const [delta, setDelta] = useState(0)
  const [reason, setReason] = useState<StockReason>('RESTOCK')
  const invalid = validateStockAdjustment(option.stock, delta, reason)

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        재고 조정
      </Button>
    )
  }
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Select
        aria-label={`${option.size} 조정 사유`}
        className="h-8 w-20"
        value={reason}
        onChange={(e) => setReason(e.target.value as StockReason)}
      >
        {Object.entries(STOCK_REASON_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        aria-label={`${option.size} 증감 수량`}
        type="number"
        className="h-8 w-20"
        value={delta}
        onChange={(e) => setDelta(Number(e.target.value))}
      />
      <Button
        size="sm"
        disabled={invalid !== null || adjust.isPending}
        onClick={() =>
          adjust.mutate(
            { delta, reason },
            {
              onSuccess: () => {
                setOpen(false)
                setDelta(0)
              },
            },
          )
        }
      >
        조정
      </Button>
      {delta !== 0 && invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {adjust.isError && <StateMessage tone="error">{getErrorMessage(adjust.error)}</StateMessage>}
    </span>
  )
}
