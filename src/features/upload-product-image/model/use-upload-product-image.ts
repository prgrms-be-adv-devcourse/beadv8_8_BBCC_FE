import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { runWithAction } from '@/shared/api'
import { canUploadImageType, validateImageCount } from './product-image.rules'
import { uploadErrorMessage, uploadImages } from './upload-images'

type UseUploadProductImageOptions = {
  /** 지금 이 칸에 들어 있는 이미지 주소 */
  imageUrls: string[]
  /** 이 칸에 올릴 수 있는 장수 */
  maxCount: number
  onChange: (imageUrls: string[]) => void
}

/**
 * 사진을 고르면 줄여서 바로 S3에 올리고, 올린 주소를 폼에 이어 붙인다.
 * 미리보기는 줄인 파일로 보여 준다 (목 업로드는 S3에 파일이 없으므로)
 */
export function useUploadProductImage({
  imageUrls,
  maxCount,
  onChange,
}: UseUploadProductImageOptions) {
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [invalid, setInvalid] = useState<string | null>(null)
  const createdUrls = useRef<string[]>([])

  useEffect(() => {
    const created = createdUrls.current
    return () => created.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const upload = useMutation({
    mutationFn: (files: File[]) => runWithAction('이미지 업로드', () => uploadImages(files)),
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
      validateImageCount(imageUrls.length, files.length, maxCount) ??
      (files.every((file) => canUploadImageType(file.type))
        ? null
        : 'JPG · PNG · WEBP 사진만 올릴 수 있어요.')
    setInvalid(message)
    if (!message) upload.mutate(files)
  }

  return {
    previewOf: (imageUrl: string) => previews[imageUrl] ?? imageUrl,
    addFiles,
    remove: (imageUrl: string) => onChange(imageUrls.filter((url) => url !== imageUrl)),
    isUploading: upload.isPending,
    error: invalid ?? (upload.isError ? uploadErrorMessage(upload.error) : null),
  }
}
