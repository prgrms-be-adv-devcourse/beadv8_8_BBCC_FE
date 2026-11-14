/** 수량이 이 값이면 주소에 싣지 않는다 (상세가 기본으로 쓰는 수량) */
const DEFAULT_QUANTITY = 1

/**
 * 담기 팝업에서 로그인하러 갈 때 돌아올 주소: 상품 상세에 고른 옵션 · 수량을 실어 되살린다.
 * 옵션을 고르기 전이면 상세 주소 그대로
 */
export function quickAddReturnPath(
  detailHref: string,
  optionId: string | null,
  quantity: number,
): string {
  if (!optionId) return detailHref
  const [path, query = ''] = detailHref.split('?')
  const params = new URLSearchParams(query)
  params.set('option', optionId)
  if (quantity !== DEFAULT_QUANTITY) params.set('qty', String(quantity))
  return `${path}?${params.toString()}`
}
