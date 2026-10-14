import { nullable, num, obj, oneOf, pageOf, str } from '@/shared/api'

const STATUS = oneOf(['PENDING', 'APPROVED', 'REJECTED'])

export const sellerApplicationShape = obj({
  id: num,
  businessName: str,
  representativeName: str,
  maskedBusinessRegistrationNumber: str,
  status: STATUS,
  createdAt: str,
  decidedAt: nullable(str),
  rejectReason: nullable(str),
})

export const sellerApplicationPageShape = pageOf(
  obj({
    id: num,
    businessName: str,
    applicantId: num,
    applicantNickname: str,
    maskedBusinessRegistrationNumber: str,
    status: STATUS,
    createdAt: str,
  }),
)

export const sellerShape = obj({
  sellerId: num,
  businessName: str,
  status: oneOf(['ACTIVE', 'SUSPENDED']),
})
