import { useEffect, type ChangeEvent } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { MockBadge } from '@/shared/ui/MockBadge'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUploadProductImage } from '../model/use-upload-product-image'

type ProductImageUploaderProps = {
  /** 올린 이미지 주소 (첫 번째가 대표) */
  value: string[]
  onChange: (imageUrls: string[]) => void
  /** 올리는 중에는 등록 버튼을 막는다 */
  onUploadingChange: (isUploading: boolean) => void
}

/** 상품 사진: 고르면 줄여서 바로 올리고 미리보기를 보여 준다 */
export function ProductImageUploader({
  value,
  onChange,
  onUploadingChange,
}: ProductImageUploaderProps) {
  const uploader = useUploadProductImage({ imageUrls: value, onChange })

  useEffect(() => {
    onUploadingChange(uploader.isUploading)
  }, [uploader.isUploading, onUploadingChange])

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    uploader.addFiles(Array.from(event.target.files ?? []))
    // 같은 파일을 다시 골라도 change가 일어나게 비운다
    event.target.value = ''
  }

  return (
    <div className="space-y-2">
      <Label>
        <span>
          상품 사진 (JPG · PNG · WEBP, 10장까지 · 첫 사진이 대표)
          <MockBadge endpoints={['POST /seller/product-images/upload-urls']} />
        </span>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploader.isUploading}
          onChange={handleSelect}
        />
      </Label>
      {uploader.isUploading && <StateMessage>사진을 줄여서 올리는 중…</StateMessage>}
      {uploader.error && <StateMessage tone="error">{uploader.error}</StateMessage>}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="올린 상품 사진">
          {value.map((imageUrl, index) => (
            <li key={imageUrl} className="w-24 space-y-1">
              <img
                src={uploader.previewOf(imageUrl)}
                alt={`상품 사진 ${index + 1}`}
                className="bg-muted aspect-square w-full rounded-md object-cover"
              />
              <div className="flex items-center justify-between">
                {index === 0 ? <Badge>대표</Badge> : <span />}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`상품 사진 ${index + 1} 빼기`}
                  disabled={uploader.isUploading}
                  onClick={() => uploader.remove(imageUrl)}
                >
                  빼기
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
