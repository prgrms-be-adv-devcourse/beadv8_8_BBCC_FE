// 가짜 백엔드의 추천 기준 옷 (BE #1111, 5칸 FE #280): 자녀별 상의 · 바지 · 아우터 · 원피스 · 치마 한 벌씩
// (응답 모양과 거절만 흉내). 세부 종류는 가짜 상품 카테고리(11 상의, 12 바지, 13 치마)로 판단한다. 가짜 상품에는
// 아우터 · 원피스 카테고리가 없어 그 칸은 저장되지 않는다. 결과는 { status, body } 또는 { status, title, detail }
const TOP_ITEMS = {
  required: ['TOTAL_LENGTH', 'CHEST_WIDTH'],
  optional: ['SHOULDER_WIDTH', 'SLEEVE_LENGTH'],
}
const PARTS = {
  TOP: { ...TOP_ITEMS, categoryIds: ['11'] },
  BOTTOM: { required: ['TOTAL_LENGTH', 'WAIST_WIDTH'], optional: ['RISE'], categoryIds: ['12'] },
  OUTER: { ...TOP_ITEMS, categoryIds: [] },
  DRESS: {
    required: ['TOTAL_LENGTH', 'CHEST_WIDTH'],
    optional: ['SHOULDER_WIDTH'],
    categoryIds: [],
  },
  SKIRT: {
    required: ['TOTAL_LENGTH', 'WAIST_WIDTH'],
    optional: ['HIP_WIDTH'],
    categoryIds: ['13'],
  },
}
const PART_ORDER = Object.keys(PARTS)

/** 산 옷 목록 한 줄의 기준 옷 칸 (BE #1249): 카테고리가 어느 칸에도 들지 않으면 null */
export const garmentPartOfCategory = (categoryId) =>
  PART_ORDER.find((part) => PARTS[part].categoryIds.includes(String(categoryId))) ?? null
const LEAF_IDS = ['11', '12', '13']
/** 자녀 ID → { TOP?: garment, BOTTOM?: garment, … } */
const garments = new Map()

const bad = (title, detail) => ({ status: 400, title, detail })
const VALUE = /^\d{1,3}(\.\d)?$/
const validValue = (value) =>
  typeof value === 'number' && VALUE.test(String(value)) && value > 0 && value <= 200

function invalid(part, body) {
  if (body?.categoryId == null || !body.measurements || typeof body.measurements !== 'object')
    return bad('잘못된 요청입니다', 'categoryId · measurements는 필수입니다.')
  const categoryId = String(body.categoryId)
  if (!LEAF_IDS.includes(categoryId))
    return bad(
      '확인할 수 없는 세부 종류입니다',
      '기준 옷의 세부 종류를 상품 카테고리에서 다시 골라 주세요.',
    )
  if (!PARTS[part].categoryIds.includes(categoryId))
    return bad(
      '구분과 맞지 않는 세부 종류입니다',
      '상의는 상의, 바지는 하의 · 바지, 아우터는 아우터, 원피스는 원피스, 치마는 치마 카테고리에서 골라 주세요.',
    )
  const codes = Object.keys(body.measurements)
  const { required, optional } = PARTS[part]
  if (codes.some((code) => !required.includes(code) && !optional.includes(code)))
    return bad(
      '이 구분에 없는 실측 항목입니다',
      '상의 · 아우터는 총장 · 가슴단면 · 어깨너비 · 소매길이, 원피스는 총장 · 가슴단면 · 어깨너비, ' +
        '바지는 총장 · 허리단면 · 밑위, 치마는 총장 · 허리단면 · 엉덩이단면만 입력할 수 있습니다.',
    )
  if (required.some((code) => !codes.includes(code)))
    return bad(
      '필수 실측이 없습니다',
      '상의 · 아우터 · 원피스는 총장과 가슴단면, 바지 · 치마는 총장과 허리단면을 입력해 주세요.',
    )
  if (Object.values(body.measurements).some((value) => !validValue(value)))
    return bad(
      '잘못된 실측 값입니다',
      '실측 값은 0cm보다 크고 200cm 이하이며, 소수 첫째 자리까지 입력할 수 있습니다.',
    )
  return null
}

/**
 * 기준 옷 경로면 처리 함수를, 아니면 null. childOf(childId)는 로그인 회원 기준으로
 * 'ok' · 'forbidden' · 'missing' 중 하나 (자녀 확인은 server.mjs가 안다)
 */
export function referenceGarmentRoute(method, path, body, childOf) {
  const match = path.match(/^\/recommendations\/children\/(\d+)\/reference-garments(?:\/([^/]+))?$/)
  if (!match) return null
  const [, childId, part] = match
  const isList = part === undefined
  if ((isList && method !== 'GET') || (!isList && !['PUT', 'DELETE'].includes(method))) return null
  return () => {
    if (!isList && !PARTS[part])
      return bad(
        '알 수 없는 기준 옷 구분입니다',
        '기준 옷 구분은 TOP · BOTTOM · OUTER · DRESS · SKIRT 중 하나입니다.',
      )
    const child = childOf(childId)
    if (child === 'missing')
      return { status: 404, title: '자녀를 찾을 수 없습니다', detail: '자녀를 다시 확인해 주세요.' }
    if (child === 'forbidden')
      return {
        status: 403,
        title: '자녀에 접근할 수 없습니다',
        detail: '로그인한 보호자의 자녀만 다룰 수 있습니다.',
      }
    const saved = garments.get(childId) ?? {}
    if (isList) return { status: 200, body: PART_ORDER.flatMap((p) => saved[p] ?? []) }
    if (method === 'DELETE') {
      delete saved[part]
      garments.set(childId, saved)
      return { status: 204 }
    }
    const problem = invalid(part, body)
    if (problem) return problem
    const garment = { part, categoryId: String(body.categoryId), measurements: body.measurements }
    garments.set(childId, { ...saved, [part]: garment })
    return { status: 200, body: garment }
  }
}
