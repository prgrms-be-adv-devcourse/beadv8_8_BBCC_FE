import { describe, expect, it } from 'vitest'
import { toAddressForm, type ShippingAddress } from '@/entities/address'
import {
  summarizeGrowth,
  toChildForm,
  toGrowthRecord,
  type Child,
  type GrowthRecord,
} from '@/entities/child'
import { NICKNAME_MAX, NICKNAME_MIN, validateNickname } from '@/entities/session'

const child: Child = {
  id: '1',
  name: '테스트',
  birthDate: '2019-01-01',
  gender: 'MALE',
  heightCm: 115,
  weightKg: 20,
  bodyType: 'NORMAL',
  preferredFit: 'LOOSE',
  growthRecordCount: 1,
}

describe('toChildForm: 수정 폼 초기값 (수정은 전체 교체라 모든 값을 채운다)', () => {
  it('화면 모델의 입력 항목을 그대로 옮긴다', () => {
    expect(toChildForm(child)).toEqual({
      name: '테스트',
      birthDate: '2019-01-01',
      gender: 'MALE',
      heightCm: 115,
      weightKg: 20,
      bodyType: 'NORMAL',
      preferredFit: 'LOOSE',
    })
  })
  it('선택 항목이 비어 있으면 null 그대로', () => {
    expect(toChildForm({ ...child, bodyType: null, preferredFit: null })).toMatchObject({
      bodyType: null,
      preferredFit: null,
    })
  })
})

describe('성장 이력', () => {
  it('toGrowthRecord: 숫자 ID를 문자열로', () => {
    expect(
      toGrowthRecord({ id: 5, heightCm: 115, bodyType: null, recordedAt: '2026-10-15T10:00:00' }),
    ).toEqual({ id: '5', heightCm: 115, bodyType: null, recordedAt: '2026-10-15T10:00:00' })
  })

  const record = (id: string, heightCm: number, recordedAt: string): GrowthRecord => ({
    id,
    heightCm,
    bodyType: 'NORMAL',
    recordedAt,
  })

  it('기록이 없으면 변화 없음', () => {
    expect(summarizeGrowth([])).toEqual({ count: 0, heightChangeCm: null, latest: null })
  })
  it('기록이 1건이면 변화를 말할 수 없다 (경계)', () => {
    expect(summarizeGrowth([record('1', 115, '2026-01-01T00:00:00')])).toMatchObject({
      count: 1,
      heightChangeCm: null,
    })
  })
  it('기록 순서와 상관없이 처음 → 마지막 키 변화를 0.1cm 단위로', () => {
    const summary = summarizeGrowth([
      record('2', 118.3, '2026-06-01T00:00:00'),
      record('1', 115, '2026-01-01T00:00:00'),
    ])
    expect(summary.heightChangeCm).toBe(3.3)
    expect(summary.latest?.id).toBe('2')
  })
})

describe('validateNickname: 닉네임 (백엔드 @NotBlank · 2~20자, 앞뒤 공백 제외)', () => {
  it('길이 기준', () => {
    expect([NICKNAME_MIN, NICKNAME_MAX]).toEqual([2, 20])
  })
  it('비었거나 공백뿐이면 안내', () => {
    expect(validateNickname('  ')).toBe('닉네임을 입력해 주세요.')
  })
  it('1자 안내 · 2자 통과 · 20자 통과 · 21자 안내 (경계)', () => {
    expect(validateNickname('가')).toBe('닉네임은 2~20자예요.')
    expect(validateNickname('가나')).toBeNull()
    expect(validateNickname('가'.repeat(20))).toBeNull()
    expect(validateNickname('가'.repeat(21))).toBe('닉네임은 2~20자예요.')
  })
  it('앞뒤 공백은 빼고 센다', () => {
    expect(validateNickname(' 가나 ')).toBeNull()
  })
})

describe('toAddressForm: 배송지 수정 폼 초기값', () => {
  const address: ShippingAddress = {
    id: '3',
    recipientName: '홍길동',
    phone: '010-0000-0000',
    zipCode: '04524',
    roadAddress: '서울시 테스트로 1',
    detailAddress: null,
    fullAddress: '서울시 테스트로 1',
    isDefault: true,
  }
  it('상세 주소가 없으면 빈 문자열로 (입력 칸용)', () => {
    expect(toAddressForm(address)).toEqual({
      recipientName: '홍길동',
      phone: '010-0000-0000',
      zipCode: '04524',
      roadAddress: '서울시 테스트로 1',
      detailAddress: '',
      isDefault: true,
    })
  })
})
