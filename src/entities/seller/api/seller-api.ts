import { useQuery } from '@tanstack/react-query'
import { apiClient, getErrorStatus, type Page } from '@/shared/api'
import type {
  SellerApplication,
  SellerApplicationStatus,
  SellerApplicationSummary,
} from '../model/types'

export const sellerKeys = {
  myApplication: ['seller', 'my-application'] as const,
  applications: (status: SellerApplicationStatus | null) =>
    ['seller', 'applications', status] as const,
}

export const sellerApi = {
  /** 신청한 적이 없으면 404 → null */
  getMyApplication: () =>
    apiClient
      .get<SellerApplication>('/members/me/seller-application')
      .then((response) => response.data)
      .catch((error: unknown) => {
        if (getErrorStatus(error) === 404) {
          return null
        }
        throw error
      }),
  listApplications: (status: SellerApplicationStatus | null) =>
    apiClient
      .get<Page<SellerApplicationSummary>>('/admin/seller-applications', {
        params: { status: status ?? undefined, page: 0, size: 20 },
      })
      .then((response) => response.data),
}

export function useMySellerApplicationQuery() {
  return useQuery({ queryKey: sellerKeys.myApplication, queryFn: sellerApi.getMyApplication })
}

export function useSellerApplicationsQuery(status: SellerApplicationStatus | null) {
  return useQuery({
    queryKey: sellerKeys.applications(status),
    queryFn: () => sellerApi.listApplications(status),
  })
}
