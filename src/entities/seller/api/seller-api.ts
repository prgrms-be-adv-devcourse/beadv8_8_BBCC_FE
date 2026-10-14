import { apiClient, getErrorStatus, type Page } from '@/shared/api'
import type {
  SellerApplicationDto,
  SellerApplicationRequestDto,
  SellerApplicationSummaryDto,
} from './seller.dto'

export const sellerApi = {
  /** 신청한 적이 없으면 404 → null */
  getMyApplication: () =>
    apiClient
      .get<SellerApplicationDto>('/members/me/seller-application')
      .then((response) => response.data)
      .catch((error: unknown) => {
        if (getErrorStatus(error) === 404) {
          return null
        }
        throw error
      }),
  apply: (request: SellerApplicationRequestDto) =>
    apiClient.post<SellerApplicationDto>('/members/me/seller-application', request),
  listApplications: (status: string | null) =>
    apiClient
      .get<Page<SellerApplicationSummaryDto>>('/admin/seller-applications', {
        params: { status: status ?? undefined, page: 0, size: 20 },
      })
      .then((response) => response.data),
  approve: (applicationId: string) =>
    apiClient.post(`/admin/seller-applications/${applicationId}/approve`),
}
