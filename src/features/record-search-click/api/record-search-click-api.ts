import { apiClient } from '@/shared/api'
import type { SearchClickRequestDto } from './record-search-click.dto'

/** 204 (본문 없음). 로그인 회원만 부른다 (비로그인은 본문과 관계없이 401) */
export function recordSearchClick(body: SearchClickRequestDto) {
  return apiClient.post<void>('/search/clicks', body)
}
