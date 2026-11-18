import { useEffect } from 'react'
import { REVIEW_IMAGE_MAX_COUNT } from '@/entities/review'
import { Button } from '@/shared/ui/button'
import { FileButton } from '@/shared/ui/FileButton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUploadReviewImage } from '../model/use-upload-review-image'

type ReviewImageUploaderProps = {
  value: string[]
  onChange: (imageUrls: string[]) => void
  /** 올리는 중에는 제출을 막는다 */
  onUploadingChange: (isUploading: boolean) => void
}

/** 리뷰 사진 (선택): 고르면 줄여서 바로 올리고 미리보기를 보여 준다 */
export function ReviewImageUploader({
  value,
  onChange,
  onUploadingChange,
}: ReviewImageUploaderProps) {
  const uploader = useUploadReviewImage({ imageUrls: value, onChange })

  useEffect(() => {
    onUploadingChange(uploader.isUploading)
  }, [uploader.isUploading, onUploadingChange])

  return (
    <div className="space-y-3">
      <FileButton
        title="사진"
        hint={`선택, JPG · PNG · WEBP ${REVIEW_IMAGE_MAX_COUNT}장까지`}
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploader.isUploading || value.length >= REVIEW_IMAGE_MAX_COUNT}
        status={
          value.length > 0 ? `${value.length}/${REVIEW_IMAGE_MAX_COUNT}장 올림` : '고른 사진 없음'
        }
        className="text-sm font-semibold"
        onSelect={uploader.addFiles}
      />
      {uploader.isUploading && <StateMessage>사진을 줄여서 올리는 중…</StateMessage>}
      {uploader.error && <StateMessage tone="error">{uploader.error}</StateMessage>}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label="올린 리뷰 사진">
          {value.map((imageUrl, index) => (
            <li key={imageUrl} className="w-20 space-y-1">
              <img
                src={uploader.previewOf(imageUrl)}
                alt={`올린 사진 ${index + 1}`}
                className="bg-paper-2 aspect-square w-full rounded-sm object-cover"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-ink-2 w-full max-lg:h-11"
                aria-label={`올린 사진 ${index + 1} 빼기`}
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
