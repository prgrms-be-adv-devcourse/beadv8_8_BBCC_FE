import { describe, expect, it } from 'vitest'
import {
  moveLink,
  toProductTypeChangeRequest,
  toProductTypeForm,
  type ProductType,
  type ProductTypeLinkForm,
} from '@/entities/catalog'

// 상품 유형 수정: 목록에서 찾은 유형을 폼으로 채우고, 연결 목록 전체를 PUT 본문으로 보낸다

const clothing: ProductType = {
  id: '1',
  name: '의류',
  links: [
    {
      attributeId: '1',
      code: 'COLOR',
      name: '색상',
      inputType: 'PALETTE',
      role: 'OPTION',
      required: true,
      allValuesAllowed: false,
      sizeRole: false,
      priceAffecting: false,
      allowedValues: [
        { id: '11', name: '네이비', colorCode: '#2f3e5c' },
        { id: '13', name: '오트밀', colorCode: '#e3d3bc' },
      ],
    },
    {
      attributeId: '4',
      code: 'FABRIC_COMPOSITION',
      name: '혼용률',
      inputType: 'TEXT',
      role: 'INFO',
      required: false,
      allValuesAllowed: true,
      sizeRole: false,
      priceAffecting: false,
      allowedValues: [],
    },
  ],
}

const link = (attributeId: string): ProductTypeLinkForm => ({
  attributeId,
  role: 'INFO',
  required: false,
  allValuesAllowed: true,
  sizeRole: false,
  priceAffecting: false,
  allowedValueIds: [],
})

describe('toProductTypeForm: 기존 유형 → 수정 폼', () => {
  it('이름과 연결 순서 · 설정을 그대로 두고, 허용 값은 ID로 바꾼다', () => {
    expect(toProductTypeForm(clothing)).toEqual({
      name: '의류',
      links: [
        {
          attributeId: '1',
          role: 'OPTION',
          required: true,
          allValuesAllowed: false,
          sizeRole: false,
          priceAffecting: false,
          allowedValueIds: ['11', '13'],
        },
        link('4'),
      ],
    })
  })
})

describe('toProductTypeChangeRequest: 수정 폼 → PUT 본문', () => {
  it('이름 없이 연결 목록 전체를 폼 순서대로 보내고, boolean 네 칸을 늘 담는다', () => {
    const form = toProductTypeForm(clothing)
    const reordered = { ...form, links: [form.links[1], form.links[0], link('7')] }
    expect(toProductTypeChangeRequest(reordered)).toEqual({
      attributes: [
        { ...link('4') },
        {
          attributeId: '1',
          role: 'OPTION',
          required: true,
          allValuesAllowed: false,
          sizeRole: false,
          priceAffecting: false,
          allowedValueIds: ['11', '13'],
        },
        { ...link('7') },
      ],
    })
  })

  it('모든 값 허용으로 넓히면 남아 있던 허용 값을 빈 목록으로 보낸다 (BE는 둘 다 있으면 400)', () => {
    const widened = { ...link('1'), allValuesAllowed: true, allowedValueIds: ['11'] }
    const request = toProductTypeChangeRequest({ name: '의류', links: [widened] })
    expect(request.attributes[0].allowedValueIds).toEqual([])
  })
})

describe('moveLink: 연결 순서 바꾸기 (순서가 곧 등록 화면 순서)', () => {
  const links = [link('1'), link('2'), link('3')]
  const ids = (items: ProductTypeLinkForm[]) => items.map((item) => item.attributeId)

  it.each([
    [1, -1, ['2', '1', '3']],
    [1, 1, ['1', '3', '2']],
    [0, 1, ['2', '1', '3']],
  ])('%i번째를 %i칸 옮기면 %j', (index, offset, expected) => {
    expect(ids(moveLink(links, index, offset))).toEqual(expected)
  })

  it.each([
    [0, -1],
    [2, 1],
  ])('맨 끝을 넘어가면(%i번째 %i칸) 그대로 둔다', (index, offset) => {
    expect(ids(moveLink(links, index, offset))).toEqual(['1', '2', '3'])
  })
})
