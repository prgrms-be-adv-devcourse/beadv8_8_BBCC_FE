/** 백엔드 목록 응답 (PageResponse). page는 0부터 */
export type Page<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}
