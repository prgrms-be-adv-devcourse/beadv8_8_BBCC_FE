import { isAxiosError } from 'axios'
import { getErrorMessage, putToPresignedUrl, UploadError } from '@/shared/api'
import { shrinkImage, type ShrinkImageOptions } from '@/shared/lib'
import { reviewImageApi } from '../api/review-image-api'
import { toReviewUploadRequest, toReviewUploadTargets } from './review-image.mapper'
import { canUploadReviewImageSize, canUploadReviewImageType } from './review-image.rules'

/** 서버는 리사이즈를 하지 않으므로 올리기 전에 줄인다 (모든 브라우저가 canvas로 저장할 수 있는 jpeg) */
const SHRINK_OPTIONS: ShrinkImageOptions = { maxEdge: 1600, type: 'image/jpeg', quality: 0.85 }

export type UploadedReviewImage = { imageUrl: string; blob: Blob }

class ShrinkError extends Error {}

async function shrinkAll(files: File[]): Promise<Blob[]> {
  const blobs = await Promise.all(
    files.map((file) =>
      shrinkImage(file, SHRINK_OPTIONS).catch(() => {
        throw new ShrinkError(`${file.name}을(를) 읽을 수 없어요. 다른 사진을 골라 주세요.`)
      }),
    ),
  )
  if (
    blobs.some(
      (blob) => !canUploadReviewImageType(blob.type) || !canUploadReviewImageSize(blob.size),
    )
  )
    throw new ShrinkError('사진을 10MB 이하 JPG로 줄이지 못했어요. 다른 사진을 골라 주세요.')
  return blobs
}

/** 줄이기 → 업로드 주소 발급(한 번에) → 파일마다 S3 PUT. 결과는 고른 순서대로 */
export async function uploadReviewImages(files: File[]): Promise<UploadedReviewImage[]> {
  const blobs = await shrinkAll(files)
  const targets = toReviewUploadTargets(
    await reviewImageApi.issueUploadUrls(toReviewUploadRequest(blobs)),
  )
  if (targets.length !== blobs.length) throw new UploadError(null)
  await Promise.all(blobs.map((blob, index) => putToPresignedUrl(targets[index].uploadUrl, blob)))
  return blobs.map((blob, index) => ({ imageUrl: targets[index].imageUrl, blob }))
}

export function reviewUploadErrorMessage(error: unknown): string {
  if (isAxiosError(error)) return getErrorMessage(error)
  if (error instanceof ShrinkError || error instanceof UploadError) return error.message
  return '사진을 올리지 못했어요. 다시 시도해 주세요.'
}
