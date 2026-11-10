import { arr, num, obj, oneOf, recordOf, str } from '@/shared/api'

export const referenceGarmentShape = obj({
  part: oneOf(['TOP', 'BOTTOM']),
  categoryId: str,
  measurements: recordOf(num),
})

export const referenceGarmentListShape = arr(referenceGarmentShape)
