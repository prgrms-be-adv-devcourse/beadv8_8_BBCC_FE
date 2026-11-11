// 추천 기준 옷 (BE #1111 ReferenceGarmentResponse · ReferenceGarmentRequest)

/** 자녀의 기준 옷 한 벌. part는 TOP · BOTTOM · OUTER · DRESS · SKIRT, 실측은 항목 코드 → cm (키 순서는 보장되지 않는다) */
export type ReferenceGarmentDto = {
  part: string
  categoryId: string
  measurements: Record<string, number>
}

/** PUT .../reference-garments/{part}. 같은 구분을 다시 보내면 통째로 바뀐다(뺀 선택 실측은 사라짐) */
export type ReferenceGarmentRequestDto = {
  categoryId: string
  measurements: Record<string, number>
}
