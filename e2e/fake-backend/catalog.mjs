// 가짜 백엔드의 관리자 상품 기준 데이터: 항목 · 목록 값 · 실측 항목 만들기와 목록 (BE #405 응답 모양만 흉내).
// 처음 데이터는 BE 초기 데이터 러너의 이름 · 코드를 일부 따른다. 결과는 { status, body } 또는 { status, detail }
const CODE = /^[A-Z_]+$/
const COLOR = /^#[0-9a-fA-F]{6}$/
const INPUT_TYPES = ['PALETTE', 'LIST', 'MULTI_LIST', 'TEXT']

let nextId = 1
const value = (name, colorCode = null) => ({ valueId: String(nextId++), name, colorCode })
const attributes = [
  {
    attributeId: String(nextId++),
    name: '색상',
    code: 'COLOR',
    inputType: 'PALETTE',
    values: [value('네이비', '#2f3e5c'), value('그레이', '#9e9e9e')],
  },
  {
    attributeId: String(nextId++),
    name: '사이즈',
    code: 'SIZE',
    inputType: 'LIST',
    values: ['100', '110', '120'].map((name) => value(name)),
  },
  {
    attributeId: String(nextId++),
    name: '혼용률',
    code: 'FABRIC_COMPOSITION',
    inputType: 'TEXT',
    values: [],
  },
]
const measurementItems = [
  { measurementItemId: String(nextId++), name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' },
  { measurementItemId: String(nextId++), name: '어깨너비', code: 'SHOULDER_WIDTH', unit: 'cm' },
]

const blank = (text) => typeof text !== 'string' || !text.trim()
const bad = (detail) => ({ status: 400, detail })
const conflict = { status: 409, detail: '다른 요청과 겹쳤습니다. 잠시 후 다시 시도해 주세요.' }

function invalidValue(body) {
  if (blank(body?.name)) return bad('목록 값 이름을 입력해 주세요.')
  if (body.colorCode != null && !COLOR.test(body.colorCode))
    return bad('색 코드는 #rrggbb 형식으로 입력해 주세요.')
  return null
}

function createAttribute(body) {
  if (blank(body?.name)) return bad('항목 이름을 입력해 주세요.')
  if (blank(body.code) || !CODE.test(body.code))
    return bad('항목 코드는 대문자와 _만 쓸 수 있습니다.')
  if (!INPUT_TYPES.includes(body.inputType))
    return bad('입력 방식은 PALETTE, LIST, MULTI_LIST, TEXT 중 하나로 보내 주세요.')
  if (!Array.isArray(body.values))
    return bad('목록 값을 보내 주세요. 없으면 빈 목록을 보내 주세요.')
  const invalid = body.values.map(invalidValue).find(Boolean)
  if (invalid) return invalid
  if (attributes.some((a) => a.code === body.code)) return conflict
  const attribute = {
    attributeId: String(nextId++),
    name: body.name,
    code: body.code,
    inputType: body.inputType,
    values: body.values.map((v) => value(v.name, v.colorCode ?? null)),
  }
  attributes.push(attribute)
  return { status: 201, body: attribute }
}

function addAttributeValue(attributeId, body) {
  const attribute = attributes.find((a) => a.attributeId === attributeId)
  if (!attribute) return { status: 404, detail: '항목을 다시 확인해 주세요.' }
  const invalid = invalidValue(body)
  if (invalid) return invalid
  if (attribute.values.some((v) => v.name === body.name)) return conflict
  const added = value(body.name, body.colorCode ?? null)
  attribute.values.push(added)
  return { status: 201, body: added }
}

function createMeasurementItem(body) {
  if (blank(body?.name)) return bad('실측 항목 이름을 입력해 주세요.')
  if (blank(body.code) || !CODE.test(body.code))
    return bad('실측 항목 코드는 대문자와 _만 쓸 수 있습니다.')
  if (blank(body.unit)) return bad('실측 단위를 입력해 주세요.')
  if (measurementItems.some((m) => m.code === body.code)) return conflict
  const item = {
    measurementItemId: String(nextId++),
    name: body.name,
    code: body.code,
    unit: body.unit,
  }
  measurementItems.push(item)
  return { status: 201, body: item }
}

/** 기준 데이터 경로면 처리 함수를, 아니면 null (권한 확인은 server.mjs) */
export function catalogRoute(method, path, body) {
  const key = `${method} ${path}`
  if (key === 'GET /admin/attributes') return () => ({ status: 200, body: attributes })
  if (key === 'POST /admin/attributes') return () => createAttribute(body)
  const values = key.match(/^POST \/admin\/attributes\/(\d+)\/values$/)
  if (values) return () => addAttributeValue(values[1], body)
  if (key === 'GET /admin/measurement-items') return () => ({ status: 200, body: measurementItems })
  if (key === 'POST /admin/measurement-items') return () => createMeasurementItem(body)
  return null
}
