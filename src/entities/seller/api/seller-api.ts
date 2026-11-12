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
      .get<SellerApplicationDto>('/members/me/seller-application', {
        expected: { statuses: [404], reason: '아직 판매자 신청이 없음' },
      })
      .then(expectShape(sellerApplicationShape))
      .catch((error: unknown) => {
        if (getErrorStatus(error) === 404) {
          return null
        }
        throw error
      }),
  apply: (request: SellerApplicationRequestDto) =>
    apiClient.post<SellerApplicationDto>('/members/me/seller-application', request),
  /** status가 없으면 전체 (최신순 20건씩). page는 0부터 */
  listApplications: (status: string | null, page = 0) =>
    apiClient
      .get<Page<SellerApplicationSummaryDto>>('/admin/seller-applications', {
        params: { status: status ?? undefined, page, size: 20 },
      })
      .then(expectShape(sellerApplicationPageShape)),
  approve: (applicationId: string) =>
    apiClient.post(`/admin/seller-applications/${applicationId}/approve`),
  /** 사유는 신청한 회원에게 그대로 보인다 */
  reject: (applicationId: string, request: RejectSellerApplicationRequestDto) =>
    apiClient.post(`/admin/seller-applications/${applicationId}/reject`, request),
  /** 판매자 자격 정지 (정지된 판매자를 돌려준다) */
  suspend: (sellerId: string, request: { reason: string }) =>
    apiClient
      .post<SellerDto>(`/admin/sellers/${sellerId}/suspend`, request)
      .then(expectShape(sellerShape)),
  /** 판매자 정보 수정 (기획서 8장 보완). 백엔드에 아직 없어 목 응답이다 */
  updateMine: (request: { businessName: string }) =>
    apiClient.patch<SellerDto>('/seller/me', request).then(expectShape(sellerShape)),
  getMine: () => apiClient.get<SellerDto>('/seller/me').then(expectShape(sellerShape)),
}
