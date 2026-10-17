import { isAxiosError } from 'axios'
import { getErrorMessage, putToPresignedUrl, UploadError } from '@/shared/api'
import { shrinkImage, type ShrinkImageOptions } from '@/shared/lib'
import { productImageApi } from '../api/product-image-api'
import { toUploadTargets, toUploadUrlsRequest, type UploadTarget } from './product-image.mapper'
import { canUploadImageSize, canUploadImageType, isUploadUrlExpired } from './product-image.rules'

/**
 * 서버는 리사이즈를 하지 않으므로 올리기 전에 줄인다. 형식은 모든 브라우저가 canvas로 저장할 수 있는 jpeg
 * (Safari 일부 버전은 webp를 요청해도 png로 저장해 오히려 커진다)
 */
const SHRINK_OPTIONS: ShrinkImageOptions = { maxEdge: 2000, type: 'image/jpeg', quality: 0.85 }

export type UploadedImage = { imageUrl: string; blob: Blob }

class ShrinkError extends Error {}

async function shrinkAll(files: File[]): Promise<Blob[]> {
  const blobs = await Promise.all(
    files.map((file) =>
      shrinkImage(file, SHRINK_OPTIONS).catch(() => {
        throw new ShrinkError(`${file.name}을(를) 읽을 수 없어요. 다른 사진을 골라 주세요.`)
      }),
    ),
  )
  if (blobs.some((blob) => !canUploadImageType(blob.type) || !canUploadImageSize(blob.size))) {
    throw new ShrinkError('사진을 10MB 이하 JPG로 줄이지 못했어요. 다른 사진을 골라 주세요.')
  }
  return blobs
}

async function issueTargets(blobs: Blob[]): Promise<UploadTarget[]> {
  const targets = toUploadTargets(await productImageApi.issueUploadUrls(toUploadUrlsRequest(blobs)))
  if (targets.length !== blobs.length) throw new UploadError(null)
  return targets
}

/** 주소가 만료됐거나 S3가 403(서명 불일치 · 만료)이면 그 파일만 발급부터 한 번 더 한다 */
async function putWithReissue(blob: Blob, target: UploadTarget): Promise<string> {
  if (!isUploadUrlExpired(target.expiresAt, new Date())) {
    try {
      await putToPresignedUrl(target.uploadUrl, blob)
      return target.imageUrl
    } catch (error) {
      if (!(error instanceof UploadError && error.status === 403)) throw error
    }
  }
  const [fresh] = await issueTargets([blob])
  await putToPresignedUrl(fresh.uploadUrl, blob)
  return fresh.imageUrl
}

/** 줄이기 → 업로드 주소 발급(한 번에) → 파일마다 S3 PUT. 결과는 고른 순서대로 */
export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  const blobs = await shrinkAll(files)
  const targets = await issueTargets(blobs)
  const imageUrls = await Promise.all(
    blobs.map((blob, index) => putWithReissue(blob, targets[index])),
  )
  return blobs.map((blob, index) => ({ imageUrl: imageUrls[index], blob }))
}

export function uploadErrorMessage(error: unknown): string {
  if (isAxiosError(error)) return getErrorMessage(error)
  if (error instanceof ShrinkError || error instanceof UploadError) return error.message
  return '사진을 올리지 못했어요. 다시 시도해 주세요.'
}
