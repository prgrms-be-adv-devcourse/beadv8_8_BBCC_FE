import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  catalogApi,
  catalogKeys,
  toAttributeCreateRequest,
  toAttributeValueRequest,
  toMeasurementItemRequest,
  toProductTypeCreateRequest,
  type AttributeForm,
  type AttributeInputType,
  type AttributeValueForm,
  type MeasurementItemForm,
  type ProductTypeForm,
} from '@/entities/catalog'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'

function useRefetch(queryKey: readonly string[], message: string) {
  const queryClient = useQueryClient()
  return () => {
    toast(message)
    return queryClient.invalidateQueries({ queryKey })
  }
}

/** 항목 만들기 (목록 값 함께). 코드가 겹치면 409 */
export function useCreateAttribute() {
  const onSuccess = useRefetch(catalogKeys.attributes, '항목을 만들었어요')
  return useMutation({
    mutationFn: (form: AttributeForm) =>
      runWithAction('항목 만들기', () =>
        catalogApi.createAttribute(toAttributeCreateRequest(form)),
      ),
    onSuccess,
  })
}

/** 기존 항목에 목록 값 하나 더하기. 같은 이름이 있으면 409 */
export function useAddAttributeValue(attributeId: string, inputType: AttributeInputType) {
  const onSuccess = useRefetch(catalogKeys.attributes, '목록 값을 더했어요')
  return useMutation({
    mutationFn: (value: AttributeValueForm) =>
      runWithAction('목록 값 더하기', () =>
        catalogApi.addAttributeValue(attributeId, toAttributeValueRequest(value, inputType)),
      ),
    onSuccess,
  })
}

/** 실측 항목 만들기. 코드가 겹치면 409 */
export function useCreateMeasurementItem() {
  const onSuccess = useRefetch(catalogKeys.measurementItems, '실측 항목을 만들었어요')
  return useMutation({
    mutationFn: (form: MeasurementItemForm) =>
      runWithAction('실측 항목 만들기', () =>
        catalogApi.createMeasurementItem(toMeasurementItemRequest(form)),
      ),
    onSuccess,
  })
}

/** 상품 유형 만들기. 유형 규칙에 어긋나면 400, 이름이 겹치면 409 */
export function useCreateProductType() {
  const onSuccess = useRefetch(catalogKeys.productTypes, '상품 유형을 만들었어요')
  return useMutation({
    mutationFn: (form: ProductTypeForm) =>
      runWithAction('상품 유형 만들기', () =>
        catalogApi.createProductType(toProductTypeCreateRequest(form)),
      ),
    onSuccess,
  })
}
