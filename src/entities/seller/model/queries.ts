import { useQuery } from '@tanstack/react-query'
import { sellerApi } from '../api/seller-api'
import type { SellerApplicationStatus } from './seller'
import { toSellerApplication, toSellerApplicationSummary } from './seller.mapper'

export const sellerKeys = {
  all: ['seller'] as const,
  myApplication: ['seller', 'my-application'] as const,
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
