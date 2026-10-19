import { describe, expect, it } from 'vitest'
import {
  missingPickMessage,
  optionChipRows,
  pickedOption,
  pickOptionValue,
  toProductDetail,
  type ProductDetailDto,
} from '@/entities/product'

// 로컬 상품 #4와 같은 모양: 색상 3 × 사이즈 3에서 코랄 핑크/130은 등록하지 않았다.
// 오트밀/130은 재고 0, 코랄 핑크/120은 3개 남았다
const COLORS = [
  { valueId: '1', value: '네이비', colorCode: '#1F2A44' },
  { valueId: '2', value: '오트밀', colorCode: '#E8DCC8' },
  { valueId: '3', value: '코랄 핑크', colorCode: '#E9A296' },
]
const SIZES = [
  { valueId: '11', value: '110', colorCode: null },
  { valueId: '12', value: '120', colorCode: null },
  { valueId: '13', value: '130', colorCode: null },
]

type OptionRow = [string, string, boolean, string, number | null]

function optionsOf(rows: OptionRow[]): ProductDetailDto['options'] {
  return rows.map(([color, size, purchasable, stockStatus, stockQuantity]) => ({
    optionId: `${color}-${size}`,
    optionName: `색상: ${COLORS.find((c) => c.valueId === color)?.value} / 사이즈: ${SIZES.find((s) => s.valueId === size)?.value}`,
    valueIds: [color, size],
    price: 25000,
    purchasable,
    stockStatus,
    stockQuantity,
  }))
}

function productOf(
  rows: OptionRow[],
  colors = COLORS,
  sizes = SIZES,
): ReturnType<typeof toProductDetail> {
  return toProductDetail({
    productId: '4',
    name: '멀티 옵션 맨투맨',
    brand: null,
    categoryId: '11',
    description: null,
    status: 'ON_SALE',
    sizeFree: false,
    minPrice: 25000,
    imageUrls: [],
    optionAttributes: [
      { attributeId: '1', code: 'COLOR', name: '색상', values: colors },
      { attributeId: '2', code: 'SIZE', name: '사이즈', values: sizes },
    ],
    options: optionsOf(rows),
    productInfo: [],
    sizeSpecs: [],
    measurementItems: [],
  })
}

const product = productOf([
  ['1', '11', true, 'AVAILABLE', null],
  ['1', '12', true, 'AVAILABLE', null],
  ['1', '13', true, 'AVAILABLE', null],
  ['2', '11', true, 'AVAILABLE', null],
  ['2', '12', true, 'AVAILABLE', null],
  ['2', '13', false, 'SOLD_OUT', null],
  ['3', '11', true, 'AVAILABLE', null],
  ['3', '12', true, 'LOW', 3],
])

const sizeChips = (picks: Record<string, string>) =>
  optionChipRows(product, picks)[1].chips.map((chip) => [chip.name, chip.state, chip.remaining])

describe('optionChipRows: 항목마다 등록된 값의 칩 한 줄', () => {
  it('줄 머리는 고른 값, 고르기 전에는 이름만', () => {
    const rows = optionChipRows(product, { '1': '2' })
    expect(rows.map((row) => [row.name, row.pickedName])).toEqual([
      ['색상', '오트밀'],
      ['사이즈', null],
    ])
    expect(rows[0].chips.map((chip) => [chip.name, chip.colorCode])).toEqual([
      ['네이비', '#1F2A44'],
      ['오트밀', '#E8DCC8'],
      ['코랄 핑크', '#E9A296'],
    ])
  })

  it.each([
    [
      '오트밀',
      '2',
      [
        ['110', 'AVAILABLE', null],
        ['120', 'AVAILABLE', null],
        ['130', 'SOLD_OUT', null],
      ],
    ],
    [
      '코랄 핑크',
      '3',
      [
        ['110', 'AVAILABLE', null],
        ['120', 'LOW', 3],
        ['130', 'NONE', null],
      ],
    ],
  ])('색상 %s를 고르면 사이즈 칩은 그 색상 기준', (_, colorId, expected) => {
    expect(sizeChips({ '1': colorId })).toEqual(expected)
  })

  it('색상을 고르기 전에는 모든 색상에서 품절인 사이즈만 막는다', () => {
    expect(sizeChips({}).map(([name, state]) => [name, state])).toEqual([
      ['110', 'AVAILABLE'],
      ['120', 'AVAILABLE'],
      ['130', 'AVAILABLE'],
    ])
    const allSoldOut = productOf([
      ['1', '11', true, 'AVAILABLE', null],
      ['1', '13', false, 'SOLD_OUT', null],
      ['2', '13', false, 'SOLD_OUT', null],
    ])
    expect(optionChipRows(allSoldOut, {})[1].chips.map((chip) => chip.state)).toEqual([
      'AVAILABLE',
      'NONE',
      'SOLD_OUT',
    ])
  })

  it('추천 사이즈 칩에 표시한다', () => {
    const rows = optionChipRows(product, {}, '120')
    expect(rows[1].chips.map((chip) => chip.isRecommended)).toEqual([false, true, false])
    expect(rows[0].chips.some((chip) => chip.isRecommended)).toBe(false)
  })

  it('값이 하나뿐인 항목은 누를 수 없는 고정 줄로 보이고, 그 값으로 정해진다 (FREE 하나뿐인 사이즈)', () => {
    const free = productOf(
      [
        ['1', '19', true, 'AVAILABLE', null],
        ['2', '19', true, 'AVAILABLE', null],
      ],
      COLORS.slice(0, 2),
      [{ valueId: '19', value: 'FREE', colorCode: null }],
    )
    const rows = optionChipRows(free, {})
    expect(rows.map((row) => [row.name, row.isFixed, row.pickedName])).toEqual([
      ['색상', false, null],
      ['사이즈', true, 'FREE'],
    ])
    expect(pickedOption(free, { '1': '2' })?.id).toBe('2-19')
  })

  it('색상이 하나뿐이면 색상 줄은 고정으로 색 점과 함께, 사이즈만 고른다', () => {
    const navyOnly = productOf(
      [
        ['1', '11', true, 'AVAILABLE', null],
        ['1', '12', true, 'AVAILABLE', null],
      ],
      COLORS.slice(0, 1),
      SIZES.slice(0, 2),
    )
    const [color, size] = optionChipRows(navyOnly, {})
    expect(color).toMatchObject({ name: '색상', isFixed: true, pickedName: '네이비' })
    expect(color.chips.map((chip) => [chip.name, chip.colorCode, chip.isPicked])).toEqual([
      ['네이비', '#1F2A44', true],
    ])
    expect(size.isFixed).toBe(false)
    expect(size.chips.map((chip) => chip.state)).toEqual(['AVAILABLE', 'AVAILABLE'])
    expect(pickedOption(navyOnly, { '2': '12' })?.id).toBe('1-12')
  })
})

describe('pickOptionValue: 고르면 막힌 뒤 항목 선택은 푼다', () => {
  it('오트밀/130을 고른 뒤 코랄 핑크로 바꾸면 사이즈 선택을 푼다', () => {
    expect(pickOptionValue(product, { '1': '1', '2': '13' }, '1', '3')).toEqual({ '1': '3' })
  })
  it('새 색상에서도 고를 수 있는 사이즈는 그대로 둔다', () => {
    expect(pickOptionValue(product, { '1': '1', '2': '12' }, '1', '3')).toEqual({
      '1': '3',
      '2': '12',
    })
  })
})

describe('pickedOption · missingPickMessage: 모두 고르면 그 조합의 옵션', () => {
  it.each([
    [{ '1': '2', '2': '12' }, '2-12', null],
    [{ '1': '2' }, null, '사이즈을(를) 골라 주세요.'],
    [{}, null, '색상을(를) 골라 주세요.'],
  ])('고른 값 %j → 옵션 %s, 안내 %s', (picks, optionId, message) => {
    expect(pickedOption(product, picks)?.id ?? null).toBe(optionId)
    expect(missingPickMessage(product, picks)).toBe(message)
  })
})
