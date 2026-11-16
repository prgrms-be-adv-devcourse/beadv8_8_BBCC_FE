import { useState } from 'react'
import {
  missingPickMessage,
  optionChipRows,
  pickedOption,
  pickOptionValue,
  picksOfOption,
} from './option-picker.rules'
import type { OptionPicks, ProductDetail } from './product'

/**
 * 옵션 고르기 상태: 고른 값에서 칩 줄 · 정해진 옵션 · 아직 안 고른 항목 안내를 만든다.
 * 추천 사이즈가 있어도 값을 대신 고르지 않는다 (칩에 추천 표시만 한다)
 */
export function useOptionPicks(product: ProductDetail, initialOptionId: string | null = null) {
  const [pickedByUser, setPicks] = useState<OptionPicks | null>(null)
  const picks = pickedByUser ?? picksOfOption(product, initialOptionId)
  return {
    /** 조합이 정해졌으면 그 옵션, 아니면 null */
    selected: pickedOption(product, picks),
    /** 아직 고르지 않은 항목 안내. 다 골랐으면 null */
    missingPick: missingPickMessage(product, picks),
    rowsFor: (recommendedSize?: string | null) => optionChipRows(product, picks, recommendedSize),
    pick: (attributeId: string, valueId: string) =>
      setPicks(pickOptionValue(product, picks, attributeId, valueId)),
  }
}
