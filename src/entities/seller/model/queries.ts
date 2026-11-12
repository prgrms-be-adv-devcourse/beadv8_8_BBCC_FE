import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { sellerApi } from '../api/seller-api'
import type { SellerApplicationStatus } from './seller'
import { toSeller, toSellerApplication, toSellerApplicationSummary } from './seller.mapper'

export const sellerKeys = {
  all: ['seller'] as const,
  myApplication: ['seller', 'my-application'] as const,
  me: ['seller', 'me'] as const,
  applications: (status: SellerApplicationStatus | null, page: number) =>
    ['seller', 'applications', status, page] as const,
}

export function useMySellerApplicationQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: sellerKeys.myApplication,
    enabled,
    queryFn: sellerApi.getMyApplication,
    select: (dto) => (dto ? toSellerApplication(dto) : null),
  })
}

/** 판매자 신청 한 페이지 (page는 0부터). 페이지를 바꾸는 동안 앞 페이지를 그대로 보인다 */
export function useSellerApplicationsQuery(status: SellerApplicationStatus | null, page = 0) {
  return useQuery({
    queryKey: sellerKeys.applications(status, page),
    queryFn: () => sellerApi.listApplications(status, page),
    placeholderData: keepPreviousData,
    select: (page) => ({ ...page, content: page.content.map(toSellerApplicationSummary) }),
  })
}

/** 내 판매자 정보. 판매자 역할일 때만 부른다 (아니면 403) */
export function useMySellerQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: sellerKeys.me,
    queryFn: sellerApi.getMine,
    select: toSeller,
  })
}
