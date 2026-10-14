import { apiClient, expectShape, getErrorStatus, type Page } from '@/shared/api'
import type {
  RejectSellerApplicationRequestDto,
  SellerApplicationDto,
  SellerApplicationRequestDto,
  SellerApplicationSummaryDto,
  SellerDto,
} from './seller.dto'
import { sellerApplicationPageShape, sellerApplicationShape, sellerShape } from './seller.shape'

export const sellerApi = {
  /** 신청한 적이 없으면 404 → null */
  getMyApplication: () =>
    apiClient
      .get<SellerApplicationDto>('/members/me/seller-application')
      .then(expectShape(sellerApplicationShape))
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
      .then(expectShape(sellerApplicationPageShape)),
  approve: (applicationId: string) =>
    apiClient.post(`/admin/seller-applications/${applicationId}/approve`),
  /** 사유는 신청한 회원에게 그대로 보인다 */
  reject: (applicationId: string, request: RejectSellerApplicationRequestDto) =>
    apiClient.post(`/admin/seller-applications/${applicationId}/reject`, request),
  getMine: () => apiClient.get<SellerDto>('/seller/me').then(expectShape(sellerShape)),
}
