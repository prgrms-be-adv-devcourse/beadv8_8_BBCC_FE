import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { ProductImagesField, RegisterProductForm } from './product'

/** 상세 사진은 10장까지 (대표 1장은 따로) */
export const DETAIL_IMAGE_MAX_COUNT = 10

export type ProductImageSlot = 'thumbnail' | 'details'

/** 등록 · 수정 폼의 사진 칸 두 개: 대표 1장 · 상세 10장 */
export function productImageFields(
  form: RegisterProductForm,
  setForm: Dispatch<SetStateAction<RegisterProductForm>>,
  onUploadingChange: (slot: ProductImageSlot, isUploading: boolean) => void,
): ProductImagesField[] {
  return [
    {
      label: '대표 사진',
      maxCount: 1,
      value: form.thumbnailUrl ? [form.thumbnailUrl] : [],
      onChange: (urls) => setForm((prev) => ({ ...prev, thumbnailUrl: urls[0] ?? null })),
      onUploadingChange: (isUploading) => onUploadingChange('thumbnail', isUploading),
    },
    {
      label: '상세 사진',
      maxCount: DETAIL_IMAGE_MAX_COUNT,
      value: form.imageUrls,
      onChange: (imageUrls) => setForm((prev) => ({ ...prev, imageUrls })),
      onUploadingChange: (isUploading) => onUploadingChange('details', isUploading),
    },
  ]
}

/** 사진 칸마다 올리는 중인지. 하나라도 올리는 중이면 저장 버튼을 막는다 */
export function useImageUploading() {
  const [uploading, setUploading] = useState<Record<ProductImageSlot, boolean>>({
    thumbnail: false,
    details: false,
  })
  const onUploadingChange = useCallback(
    (slot: ProductImageSlot, isUploading: boolean) =>
      setUploading((prev) =>
        prev[slot] === isUploading ? prev : { ...prev, [slot]: isUploading },
      ),
    [],
  )
  return { isUploading: uploading.thumbnail || uploading.details, onUploadingChange }
}
