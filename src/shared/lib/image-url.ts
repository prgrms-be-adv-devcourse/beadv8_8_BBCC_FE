/** 응답의 이미지 주소(S3 등). 없거나 빈 값이면 null → 화면이 기본 이미지를 쓴다 */
export function toImageUrl(raw: string | null | undefined): string | null {
  const url = raw?.trim()
  return url ? url : null
}
