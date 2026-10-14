import { useQuery } from '@tanstack/react-query'
import { sellerApi } from '../api/seller-api'
import type { SellerApplicationStatus } from './seller'
import { toSeller, toSellerApplication, toSellerApplicationSummary } from './seller.mapper'

export const sellerKeys = {
  all: ['seller'] as const,
  myApplication: ['seller', 'my-application'] as const,
  me: ['seller', 'me'] as const,
  applications: (status: SellerApplicationStatus | null) =>
    ['seller', 'applications', status] as const,
}

export function useMySellerApplicationQuery() {
  return useQuery({
    queryKey: sellerKeys.myApplication,
    queryFn: sellerApi.getMyApplication,
    select: (dto) => (dto ? toSellerApplication(dto) : null),
  })
}

export function useSellerApplicationsQuery(status: SellerApplicationStatus | null) {
  return useQuery({
    queryKey: sellerKeys.applications(status),
    queryFn: () => sellerApi.listApplications(status),
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
