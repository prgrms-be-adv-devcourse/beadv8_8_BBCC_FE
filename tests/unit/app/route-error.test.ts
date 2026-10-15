import { describe, expect, it } from 'vitest'
import { describeRouteError } from '@/app/layouts/route-error'

describe('describeRouteError: 오류 → 안내 문구', () => {
  it('없는 화면(404 응답)', () => {
    const error = { status: 404, statusText: 'Not Found', internal: true, data: '' }
    expect(describeRouteError(error)).toEqual({
      title: '화면을 찾을 수 없어요',
      detail: null,
      reload: false,
    })
  })

  it('그 밖의 오류 응답은 상태 코드를 보여 준다', () => {
    const error = { status: 500, statusText: 'Server Error', internal: false, data: '' }
    expect(describeRouteError(error)).toMatchObject({
      title: '문제가 생겼어요 (500)',
      reload: true,
    })
  })

  it('화면 파일을 못 불러오면 새로고침 안내 (배포 직후 등)', () => {
    const error = new TypeError('Failed to fetch dynamically imported module: /assets/x.js')
    expect(describeRouteError(error)).toMatchObject({
      title: '화면을 불러오지 못했어요',
      reload: true,
    })
  })

  it('그리다 난 오류는 메시지를 함께 보여 준다', () => {
    expect(describeRouteError(new Error('boom'))).toEqual({
      title: '화면을 그리다 문제가 생겼어요',
      detail: 'boom',
      reload: true,
    })
  })

  it('알 수 없는 값', () => {
    expect(describeRouteError('x')).toEqual({
      title: '문제가 생겼어요',
      detail: null,
      reload: true,
    })
  })
})
