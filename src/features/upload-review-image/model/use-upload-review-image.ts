import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { REVIEW_IMAGE_MAX_COUNT } from '@/entities/review'
import { runWithAction } from '@/shared/api'
import { canUploadReviewImageType } from './review-image.rules'
import { reviewUploadErrorMessage, uploadReviewImages } from './upload-review-images'

type UseUploadReviewImageOptions = {
  imageUrls: string[]
  onChange: (imageUrls: string[]) => void
}

/** 사진을 고르면 줄여서 바로 S3에 올리고, 올린 주소를 초안에 이어 붙인다. 미리보기는 줄인 파일로 */
export function useUploadReviewImage({ imageUrls, onChange }: UseUploadReviewImageOptions) {
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [invalid, setInvalid] = useState<string | null>(null)
  const createdUrls = useRef<string[]>([])

  useEffect(() => {
    const created = createdUrls.current
    return () => created.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const upload = useMutation({
    mutationFn: (files: File[]) =>
      runWithAction('리뷰 사진 올리기', () => uploadReviewImages(files)),
    onSuccess: (uploaded) => {
      const added = uploaded.map(({ imageUrl, blob }) => {
        const previewUrl = URL.createObjectURL(blob)
        createdUrls.current.push(previewUrl)
        return [imageUrl, previewUrl] as const
      })
      setPreviews((prev) => ({ ...prev, ...Object.fromEntries(added) }))
      onChange([...imageUrls, ...uploaded.map((image) => image.imageUrl)])
    },
  })

  const addFiles = (files: File[]) => {
    if (files.length === 0) return
    const message =
      imageUrls.length + files.length > REVIEW_IMAGE_MAX_COUNT
        ? `사진은 ${REVIEW_IMAGE_MAX_COUNT}장까지 올릴 수 있어요.`
        : files.every((file) => canUploadReviewImageType(file.type))
          ? null
          : 'JPG · PNG · WEBP 사진만 올릴 수 있어요.'
    setInvalid(message)
    if (!message) upload.mutate(files)
  }

  return {
    previewOf: (imageUrl: string) => previews[imageUrl] ?? imageUrl,
    addFiles,
    remove: (imageUrl: string) => onChange(imageUrls.filter((url) => url !== imageUrl)),
    isUploading: upload.isPending,
    error: invalid ?? (upload.isError ? reviewUploadErrorMessage(upload.error) : null),
  }
}
