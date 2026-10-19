import { describe, expect, it } from 'vitest'
import { CARRIERS, carrierName } from '@/shared/config'

describe('택배사 코드 ↔ 화면 이름 (BE Delivery.Carrier)', () => {
  it('선택지는 운영 택배사 5개, 값은 코드 (DUMMY 제외)', () => {
    expect(CARRIERS.map((carrier) => carrier.code)).toEqual([
      'CJ',
      'EPOST',
      'HANJIN',
      'LOTTE',
      'LOGEN',
    ])
  })

  it('코드는 화면 이름으로, 표에 없는 값은 받은 그대로, 없으면 -', () => {
    expect(carrierName('CJ')).toBe('CJ대한통운')
    expect(carrierName('LOGEN')).toBe('로젠택배')
    expect(carrierName('DUMMY')).toBe('DUMMY')
    expect(carrierName(null)).toBe('-')
  })
})
