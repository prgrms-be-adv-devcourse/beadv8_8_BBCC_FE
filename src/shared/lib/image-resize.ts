export type ImageSize = { width: number; height: number }

/** 긴 변이 maxEdge보다 크면 비율을 지켜 줄인 크기. 작으면 그대로 (키우지 않는다) */
export function fitWithin(size: ImageSize, maxEdge: number): ImageSize {
  const ratio = maxEdge / Math.max(size.width, size.height)
  if (ratio >= 1) return { width: size.width, height: size.height }
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  }
}

export type ShrinkImageOptions = {
  /** 긴 변 최대 px */
  maxEdge: number
  /** 다시 저장할 형식 (예: image/jpeg) */
  type: string
  /** 0 ~ 1 */
  quality: number
}

/**
 * 브라우저에서 이미지를 줄여 다시 저장한다. 사진의 회전 정보는 반영하고 EXIF(위치 등)는 남기지 않는다.
 * 읽을 수 없는 파일이면 reject한다. 결과 형식은 브라우저가 정하므로 돌려받은 Blob의 type을 쓴다
 */
export async function shrinkImage(file: Blob, options: ShrinkImageOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = fitWithin(bitmap, options.maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('이미지를 줄일 수 없어요.')
    // jpeg는 투명을 담지 못하므로 흰 바탕을 먼저 칠한다 (png 투명 부분이 검게 나오지 않게)
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('이미지를 줄일 수 없어요.'))),
        options.type,
        options.quality,
      )
    })
  } finally {
    bitmap.close()
  }
}
