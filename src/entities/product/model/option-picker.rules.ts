import type {
  OptionChipRow,
  OptionChipState,
  OptionPicks,
  ProductDetail,
  ProductOption,
} from './product'

type Picker = Pick<ProductDetail, 'optionAttributes' | 'options'>

/** 값이 하나뿐인 항목은 고르는 단계를 건너뛰고 그 값으로 정한다 */
function withSinglePicks(product: Picker, picks: OptionPicks): OptionPicks {
  const singles = product.optionAttributes
    .filter((attribute) => attribute.values.length === 1)
    .map((attribute) => [attribute.id, attribute.values[0].id])
  return { ...Object.fromEntries(singles), ...picks }
}

/** 앞 항목에서 고른 값과 이 값을 모두 가진 옵션 */
function candidatesOf(product: Picker, index: number, valueId: string, picks: OptionPicks) {
  const earlier = product.optionAttributes
    .slice(0, index)
    .flatMap((attribute) => (picks[attribute.id] ? [picks[attribute.id]] : []))
  return product.options.filter((option) =>
    [...earlier, valueId].every((id) => option.valueIds.includes(id)),
  )
}

/** 값 칩의 상태: 앞 항목에서 고른 값 기준 (뒤 항목 선택은 보지 않는다) */
function chipStateOf(candidates: ProductOption[]): {
  state: OptionChipState
  remaining: number | null
} {
  if (candidates.length === 0) return { state: 'NONE', remaining: null }
  if (candidates.every((option) => option.soldOut)) return { state: 'SOLD_OUT', remaining: null }
  const only = candidates.length === 1 ? candidates[0] : null
  if (only?.stockStatus === 'LOW' && only.stockQuantity !== null)
    return { state: 'LOW', remaining: only.stockQuantity }
  return { state: 'AVAILABLE', remaining: null }
}

export function isChipPickable(state: OptionChipState): boolean {
  return state === 'AVAILABLE' || state === 'LOW'
}

/** 항목마다 칩 한 줄. 앞 항목을 고르면 뒤 항목 칩이 그 기준으로 바뀐다. 값이 하나뿐인 항목은 고정 줄 (그 값으로 정해져 있다) */
export function optionChipRows(
  product: Picker,
  picks: OptionPicks,
  recommendedSize?: string | null,
): OptionChipRow[] {
  const effective = withSinglePicks(product, picks)
  return product.optionAttributes.flatMap((attribute, index) => {
    if (attribute.values.length === 0) return []
    const picked = attribute.values.find((value) => value.id === effective[attribute.id])
    return [
      {
        attributeId: attribute.id,
        name: attribute.name,
        pickedName: picked?.name ?? null,
        isFixed: attribute.values.length === 1,
        chips: attribute.values.map((value) => ({
          valueId: value.id,
          name: value.name,
          colorCode: value.colorCode,
          ...chipStateOf(candidatesOf(product, index, value.id, effective)),
          isPicked: value.id === picked?.id,
          isRecommended: attribute.isSize && value.name === recommendedSize,
        })),
      },
    ]
  })
}

/** 값을 고른다. 새로 고른 값 기준으로 막히는 뒤 항목 선택은 푼다 */
export function pickOptionValue(
  product: Picker,
  picks: OptionPicks,
  attributeId: string,
  valueId: string,
): OptionPicks {
  const next: OptionPicks = { ...picks, [attributeId]: valueId }
  const start = product.optionAttributes.findIndex((attribute) => attribute.id === attributeId)
  product.optionAttributes.slice(start + 1).forEach((attribute, offset) => {
    const pickedId = next[attribute.id]
    if (!pickedId) return
    const candidates = candidatesOf(
      product,
      start + 1 + offset,
      pickedId,
      withSinglePicks(product, next),
    )
    if (!isChipPickable(chipStateOf(candidates).state)) delete next[attribute.id]
  })
  return next
}

/** 모든 항목을 고르면 그 조합의 옵션. 아직이거나 없는 조합이면 null */
export function pickedOption(product: Picker, picks: OptionPicks): ProductOption | null {
  const effective = withSinglePicks(product, picks)
  const valueIds = product.optionAttributes.map((attribute) => effective[attribute.id])
  if (valueIds.some((id) => !id)) return null
  return (
    product.options.find(
      (option) =>
        option.valueIds.length === valueIds.length &&
        valueIds.every((id) => option.valueIds.includes(id)),
    ) ?? null
  )
}

/** 아직 고르지 않은 첫 항목 안내. 모두 골랐으면 null */
export function missingPickMessage(product: Picker, picks: OptionPicks): string | null {
  const effective = withSinglePicks(product, picks)
  const missing = product.optionAttributes.find((attribute) => !effective[attribute.id])
  return missing ? `${missing.name}을(를) 골라 주세요.` : null
}
