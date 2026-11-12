import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { sellerApi } from '../api/seller-api'
import type { SellerApplicationStatus } from './seller'
import { toSeller, toSellerApplication, toSellerApplicationSummary } from './seller.mapper'

export const sellerKeys = {
  all: ['seller'] as const,
  myApplication: ['seller', 'my-application'] as const,
  me: ['seller', 'me'] as const,
  applications: (status: SellerApplicationStatus | null, page = 0) =>
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

/** 판매자 신청 (status가 null이면 전체, 20건씩, page는 0부터). 쪽을 넘기는 동안 앞 쪽을 보여 준다 */
export function useSellerApplicationsQuery(status: SellerApplicationStatus | null, page = 0) {
  return useQuery({
    queryKey: sellerKeys.applications(status, page),
    queryFn: () => sellerApi.listApplications(status, page),
    select: (result) => ({ ...result, content: result.content.map(toSellerApplicationSummary) }),
    placeholderData: keepPreviousData,
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
