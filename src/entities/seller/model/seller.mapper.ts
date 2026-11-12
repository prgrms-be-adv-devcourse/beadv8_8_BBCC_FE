import type {
  SellerApplicationDto,
  SellerApplicationRequestDto,
  SellerApplicationSummaryDto,
  SellerDto,
} from '../api/seller.dto'
import type {
  SellerApplication,
  SellerApplicationForm,
  SellerApplicationStatus,
  SellerApplicationSummary,
  Seller,
  SellerStatus,
} from './seller'

export function toSellerApplication(dto: SellerApplicationDto): SellerApplication {
  return {
    id: String(dto.id),
    businessName: dto.businessName,
    representativeName: dto.representativeName,
    maskedBusinessRegistrationNumber: dto.maskedBusinessRegistrationNumber,
    status: dto.status as SellerApplicationStatus,
    createdAt: dto.createdAt,
    rejectReason: dto.rejectReason,
  }
}

// 신청한 회원이 탈퇴하면 백엔드가 닉네임 · 사업자등록번호를 비운다
const WITHDRAWN_APPLICANT = '탈퇴한 회원'
const WITHDRAWN_BUSINESS_REGISTRATION_NUMBER = '탈퇴로 삭제됨'

export function toSellerApplicationSummary(
  dto: SellerApplicationSummaryDto,
): SellerApplicationSummary {
  return {
    id: String(dto.id),
    businessName: dto.businessName,
    applicantId: String(dto.applicantId),
    applicantNickname: dto.applicantNickname ?? WITHDRAWN_APPLICANT,
    maskedBusinessRegistrationNumber:
      dto.maskedBusinessRegistrationNumber ?? WITHDRAWN_BUSINESS_REGISTRATION_NUMBER,
    status: dto.status as SellerApplicationStatus,
    createdAt: dto.createdAt,
  }
}

export function toSellerApplicationRequest(
  form: SellerApplicationForm,
): SellerApplicationRequestDto {
  return {
    businessName: form.businessName.trim(),
    representativeName: form.representativeName.trim(),
    businessRegistrationNumber: form.businessRegistrationNumber.trim(),
  }
}

export function toSeller(dto: SellerDto): Seller {
  return {
    id: String(dto.sellerId),
    businessName: dto.businessName,
    status: dto.status as SellerStatus,
  }
}
