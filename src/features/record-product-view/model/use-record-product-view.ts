import { useEffect, useRef } from 'react'
import { runWithAction } from '@/shared/api'
import { recordProductView } from '../api/record-product-view-api'
import { toProductViewRequest } from './product-view.mapper'

/**
 * 상세에 들어오거나 자녀를 바꾸면 한 번 기록한다. 추천은 상세 진입을 이 호출로만 센다.
 * 같은 상품 · 자녀로 다시 그릴 때는 보내지 않고, 실패해도 화면에는 알리지 않는다
 */
export function useRecordProductView(
  productId: string,
  childId: string | null,
  isEnabled: boolean,
): void {
  const recordedKey = useRef<string | null>(null)
  useEffect(() => {
    if (!isEnabled || !productId) return
    const key = `${productId}:${childId ?? ''}`
    if (recordedKey.current === key) return
    recordedKey.current = key
    runWithAction('상세 진입 기록', () =>
      recordProductView(toProductViewRequest(productId, childId)),
    ).catch(() => undefined)
  }, [productId, childId, isEnabled])
}
