import { describe, expect, it } from 'vitest'
import { validate } from '@/shared/api'
import { guardianVerificationShape } from '@/entities/guardian-verification/api/guardian-verification.shape'
import { verificationError } from '@/features/verify-guardian/lib/portone.rules'

describe('부모 본인인증 계약', () => {
  it('인증 여부와 인증 시각을 검사한다', () => {
    expect(validate({ verified: false, verifiedAt: null }, guardianVerificationShape)).toEqual([])
    expect(
      validate({ verified: true, verifiedAt: '2026-11-05T00:00:00' }, guardianVerificationShape),
    ).toEqual([])
    expect(validate({ verified: 'true', verifiedAt: null }, guardianVerificationShape)).not.toEqual(
      [],
    )
  })
  it('SDK 결과에 code가 있으면 실패한다', () => {
    expect(verificationError({})).toBeNull()
    expect(verificationError({ code: 'CANCEL', message: '취소됨' })).toBe('취소됨')
    expect(verificationError({ code: 'CANCEL' })).toBe('본인인증을 완료하지 못했어요.')
  })
})
