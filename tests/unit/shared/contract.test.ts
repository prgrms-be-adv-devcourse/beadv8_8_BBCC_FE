import { describe, expect, it } from 'vitest'
import { arr, nullable, num, obj, oneOf, pageOf, str, validate } from '@/shared/api'

const shape = obj({
  id: str,
  status: oneOf(['PAID', 'CANCELLED']),
  reason: nullable(str),
  items: arr(obj({ amount: num })),
})

describe('계약 검사', () => {
  it('모양이 같으면 문제가 없다', () => {
    expect(
      validate({ id: '1', status: 'PAID', reason: null, items: [{ amount: 1 }] }, shape),
    ).toEqual([])
  })
  it('필드가 없으면 missing', () => {
    expect(validate({ status: 'PAID', reason: null, items: [] }, shape)).toEqual([
      { path: 'id', type: 'missing', expected: 'string', actual: '없음' },
    ])
  })
  it('타입이 다르면 type (숫자 ID가 오는 경우)', () => {
    expect(validate({ id: 1, status: 'PAID', reason: null, items: [] }, shape)[0]).toMatchObject({
      path: 'id',
      type: 'type',
    })
  })
  it('enum에 없는 값이면 enum', () => {
    expect(
      validate({ id: '1', status: 'PENDING', reason: null, items: [] }, shape)[0],
    ).toMatchObject({
      path: 'status',
      type: 'enum',
      actual: '"PENDING"',
    })
  })
  it('nullable이 아닌데 null이면 type', () => {
    expect(validate({ id: null, status: 'PAID', reason: null, items: [] }, shape)[0]).toMatchObject(
      { path: 'id', type: 'type', actual: 'null' },
    )
  })
  it('배열 안 문제는 위치를 경로에 남긴다', () => {
    expect(
      validate(
        { id: '1', status: 'PAID', reason: null, items: [{ amount: 1 }, { amount: '2' }] },
        shape,
      )[0],
    ).toMatchObject({
      path: 'items[1].amount',
      type: 'type',
    })
  })
  it('계약에 없는 필드는 extra로 따로 알린다', () => {
    expect(
      validate({ id: '1', status: 'PAID', reason: null, items: [], memberId: 3 }, shape),
    ).toEqual([{ path: 'memberId', type: 'extra', expected: '(계약에 없음)', actual: 'number' }])
  })
  it('페이지 응답 모양', () => {
    const page = {
      content: [{ amount: 1 }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    }
    expect(validate(page, pageOf(obj({ amount: num })))).toEqual([])
  })
})
