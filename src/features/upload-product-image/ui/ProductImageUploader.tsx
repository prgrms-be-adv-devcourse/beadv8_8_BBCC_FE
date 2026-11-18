import { useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { FileButton } from '@/shared/ui/FileButton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUploadProductImage } from '../model/use-upload-product-image'

type ProductImageUploaderProps = {
  /** 칸 이름 (예: 대표 사진) */
  label: string
  /** 이 칸에 올릴 수 있는 장수 */
  maxCount: number
  /** 올린 이미지 주소 */
  value: string[]
  onChange: (imageUrls: string[]) => void
  /** 올리는 중에는 등록 버튼을 막는다 */
  onUploadingChange: (isUploading: boolean) => void
}

/** 상품 사진: 고르면 줄여서 바로 올리고 미리보기를 보여 준다 */
export function ProductImageUploader({
  label,
  maxCount,
  value,
  onChange,
  onUploadingChange,
}: ProductImageUploaderProps) {
  const uploader = useUploadProductImage({ imageUrls: value, maxCount, onChange })

  useEffect(() => {
    onUploadingChange(uploader.isUploading)
  }, [uploader.isUploading, onUploadingChange])

  return (
    <div className="space-y-3">
      <FileButton
        title={label}
        hint={`JPG, PNG, WEBP, ${maxCount}장까지`}
        accept="image/jpeg,image/png,image/webp"
        multiple={maxCount > 1}
        disabled={uploader.isUploading}
        status={value.length > 0 ? `${value.length}/${maxCount}장 올림` : '고른 사진 없음'}
        className="text-ink-2"
        onSelect={uploader.addFiles}
      />
      {uploader.isUploading && <StateMessage>사진을 줄여서 올리는 중…</StateMessage>}
      {uploader.error && <StateMessage tone="error">{uploader.error}</StateMessage>}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label={`올린 ${label}`}>
          {value.map((imageUrl, index) => (
            <li key={imageUrl} className="w-20 space-y-1">
              <img
                src={uploader.previewOf(imageUrl)}
                alt={`${label} ${index + 1}`}
                className="bg-paper-2 aspect-square w-full rounded-sm object-cover"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-ink-2 w-full max-lg:h-11"
                aria-label={`${label} ${index + 1} 빼기`}
                disabled={uploader.isUploading}
                onClick={() => uploader.remove(imageUrl)}
              >
                빼기
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
