import { useEffect, type ChangeEvent } from 'react'
import { REVIEW_IMAGE_MAX_COUNT } from '@/entities/review'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
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

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    uploader.addFiles(Array.from(event.target.files ?? []))
    // 같은 파일을 다시 골라도 change가 일어나게 비운다
    event.target.value = ''
  }

  return (
    <div className="space-y-3">
      <Label className="gap-2 text-sm font-semibold">
        사진 (선택, JPG · PNG · WEBP {REVIEW_IMAGE_MAX_COUNT}장까지)
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploader.isUploading || value.length >= REVIEW_IMAGE_MAX_COUNT}
          onChange={handleSelect}
          className="file:bg-paper-2 file:text-ink hover:file:bg-paper-3 h-10 py-1 pl-1 file:mr-3 file:h-full file:cursor-pointer file:rounded-sm file:border-0 file:px-3 file:text-[13px] file:font-semibold file:transition-colors"
        />
      </Label>
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
