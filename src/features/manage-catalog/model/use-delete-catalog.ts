import { useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogApi, catalogKeys } from '@/entities/catalog'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'

/** 지울 기준 데이터. 목록 값은 그 항목의 ID도 함께 보낸다 */
export type CatalogDeleteTarget =
  | { kind: 'attribute'; id: string }
  | { kind: 'attributeValue'; attributeId: string; id: string }
  | { kind: 'measurementItem'; id: string }
  | { kind: 'productType'; id: string }
  | { kind: 'category'; id: string }

type CatalogKind = CatalogDeleteTarget['kind']

/** 종류마다 이름(행동 이름), 목적어(확인 창 · 알림)와 지운 뒤 다시 읽을 목록 */
const KIND: Record<CatalogKind, { label: string; object: string; queryKey: readonly string[] }> = {
  attribute: { label: '항목', object: '항목을', queryKey: catalogKeys.attributes },
  attributeValue: { label: '목록 값', object: '목록 값을', queryKey: catalogKeys.attributes },
  measurementItem: {
    label: '실측 항목',
    object: '실측 항목을',
    queryKey: catalogKeys.measurementItems,
  },
  productType: { label: '상품 유형', object: '상품 유형을', queryKey: catalogKeys.productTypes },
  category: { label: '카테고리', object: '카테고리를', queryKey: catalogKeys.categories },
}

/** 확인 창 · 알림에 쓰는 목적어 (예: 카테고리를) */
export const catalogKindObject = (kind: CatalogKind) => KIND[kind].object

function deleteTarget(target: CatalogDeleteTarget): Promise<void> {
  switch (target.kind) {
    case 'attribute':
      return catalogApi.deleteAttribute(target.id)
    case 'attributeValue':
      return catalogApi.deleteAttributeValue(target.attributeId, target.id)
    case 'measurementItem':
      return catalogApi.deleteMeasurementItem(target.id)
    case 'productType':
      return catalogApi.deleteProductType(target.id)
    case 'category':
      return catalogApi.deleteCategory(target.id)
  }
}

/** 기준 데이터 하나 지우기 (204). 쓰이는 중이면 409라 그 설명을 화면이 보여 준다. 지우면 그 목록을 다시 읽는다 */
export function useDeleteCatalogItem(target: CatalogDeleteTarget) {
  const queryClient = useQueryClient()
  const { label, object, queryKey } = KIND[target.kind]
  return useMutation({
    mutationFn: () => runWithAction(`${label} 삭제`, () => deleteTarget(target)),
    onSuccess: () => {
      toast(`${object} 지웠어요`)
      return queryClient.invalidateQueries({ queryKey })
    },
  })
}
