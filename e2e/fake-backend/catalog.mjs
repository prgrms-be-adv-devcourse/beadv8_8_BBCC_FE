// 가짜 백엔드의 관리자 상품 기준 데이터: 항목 · 목록 값 · 실측 항목(BE #405) · 상품 유형(BE #424) · 카테고리(BE #425) 만들기와 목록 (응답 모양만 흉내).
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

// 상품 유형: 연결은 항목 ID · 설정 · 허용 값 ID로 두고, 응답할 때 항목에서 이름 · 코드 · 값을 읽는다
// 처음 데이터: BE 초기 데이터의 「의류」(색상 · 사이즈 옵션, 혼용률 정보, 모두 모든 값 허용)
const seedLink = (code, role, required, sizeRole = false) => ({
  attributeId: attributes.find((a) => a.code === code).attributeId,
  role,
  required,
  allValuesAllowed: true,
  sizeRole,
  priceAffecting: false,
  allowedValueIds: [],
})
const productTypes = [
  {
    productTypeId: String(nextId++),
    name: '의류',
    links: [
      seedLink('COLOR', 'OPTION', true),
      seedLink('SIZE', 'OPTION', true, true),
      seedLink('FABRIC_COMPOSITION', 'INFO', false),
    ],
  },
]
const BOOLEANS = ['required', 'allValuesAllowed', 'sizeRole', 'priceAffecting']
const ruleBroken = (detail) => ({ status: 400, detail })

function productTypeOut(type) {
  return {
    productTypeId: type.productTypeId,
    name: type.name,
    attributes: type.links.map(({ attributeId, allowedValueIds, ...settings }) => {
      const a = attributes.find((item) => item.attributeId === attributeId)
      const allowedValues = a.values.filter((v) => allowedValueIds.includes(v.valueId))
      return {
        attributeId,
        code: a.code,
        name: a.name,
        inputType: a.inputType,
        ...settings,
        allowedValues,
      }
    }),
  }
}

// BE는 boolean 네 칸이 빠지면 400 (Jackson 3 기본값). 유형 규칙은 필수 옵션만 흉내 낸다
function createProductType(body) {
  if (blank(body?.name)) return bad('유형 이름을 입력해 주세요.')
  if (!Array.isArray(body.attributes)) return bad('연결할 항목을 보내 주세요.')
  for (const link of body.attributes) {
    if (BOOLEANS.some((key) => typeof link[key] !== 'boolean'))
      return bad('요청 값을 확인해 주세요.')
    if (!Array.isArray(link.allowedValueIds))
      return bad('허용할 값 ID를 보내 주세요. 없으면 빈 목록을 보내 주세요.')
    const a = attributes.find((item) => item.attributeId === String(link.attributeId))
    if (!a) return { status: 404, detail: '항목을 다시 확인해 주세요.' }
    if (link.allowedValueIds.some((id) => !a.values.some((v) => v.valueId === String(id))))
      return { status: 404, detail: '목록 값을 다시 확인해 주세요.' }
  }
  if (!body.attributes.some((link) => link.role === 'OPTION' && link.required))
    return ruleBroken('필수 옵션 항목을 하나 이상 연결해 주세요.')
  const ids = body.attributes.map((link) => String(link.attributeId))
  if (new Set(ids).size !== ids.length || productTypes.some((t) => t.name === body.name))
    return conflict
  const type = {
    productTypeId: String(nextId++),
    name: body.name,
    links: body.attributes.map((link) => ({
      attributeId: String(link.attributeId),
      role: link.role,
      ...Object.fromEntries(BOOLEANS.map((key) => [key, link[key]])),
      allowedValueIds: link.allowedValueIds.map(String),
    })),
  }
  productTypes.push(type)
  return { status: 201, body: productTypeOut(type) }
}

// 카테고리: 평면 목록(ID 순서). 말단만 상품 유형과 필수 실측 항목(ID, 넣은 순서)을 가진다
const leafOf = (name, parentId, codes) => ({
  categoryId: String(nextId++),
  name,
  parentId,
  productTypeId: productTypes[0].productTypeId,
  measurementItemIds: codes.map(
    (code) => measurementItems.find((m) => m.code === code).measurementItemId,
  ),
})
const clothing = {
  categoryId: String(nextId++),
  name: '의류',
  parentId: null,
  productTypeId: null,
  measurementItemIds: [],
}
const categories = [
  clothing,
  leafOf('상의', clothing.categoryId, ['TOTAL_LENGTH', 'SHOULDER_WIDTH']),
  leafOf('하의', clothing.categoryId, ['TOTAL_LENGTH']),
]

function categoryOut({ measurementItemIds, ...category }) {
  return {
    ...category,
    leaf: category.productTypeId !== null,
    productTypeName:
      productTypes.find((t) => t.productTypeId === category.productTypeId)?.name ?? null,
    measurementItems: measurementItemIds.map((id) =>
      measurementItems.find((m) => m.measurementItemId === id),
    ),
  }
}

function createCategory(body) {
  if (blank(body?.name)) return bad('카테고리 이름을 입력해 주세요.')
  if (!Array.isArray(body.measurementItemIds))
    return bad('실측 항목 ID를 보내 주세요. 없으면 빈 목록을 보내 주세요.')
  const productTypeId = body.productTypeId == null ? null : String(body.productTypeId)
  const parentId = body.parentId == null ? null : String(body.parentId)
  const itemIds = body.measurementItemIds.map(String)
  if (!productTypeId && itemIds.length > 0)
    return bad('실측 항목은 상품 유형을 고른 카테고리에만 넣어 주세요.')
  const parent = categories.find((c) => c.categoryId === parentId)
  if (parentId && !parent) return { status: 404, detail: '카테고리를 다시 확인해 주세요.' }
  if (parent?.productTypeId) return bad('말단 카테고리 아래에는 카테고리를 만들 수 없습니다.')
  if (productTypeId && !productTypes.some((t) => t.productTypeId === productTypeId))
    return { status: 404, detail: '상품 유형을 다시 확인해 주세요.' }
  if (itemIds.some((id) => !measurementItems.some((m) => m.measurementItemId === id)))
    return { status: 404, detail: '실측 항목을 다시 확인해 주세요.' }
  if (categories.some((c) => c.parentId === parentId && c.name === body.name)) return conflict
  const category = {
    categoryId: String(nextId++),
    name: body.name,
    parentId,
    productTypeId,
    measurementItemIds: itemIds,
  }
  categories.push(category)
  return { status: 201, body: categoryOut(category) }
}

/** 기준 데이터 경로면 처리 함수를, 아니면 null (권한 확인은 server.mjs) */
export function catalogRoute(method, path, body) {
  const key = `${method} ${path}`
  if (key === 'GET /admin/attributes') return () => ({ status: 200, body: attributes })
  if (key === 'POST /admin/attributes') return () => createAttribute(body)
  const values = key.match(/^POST \/admin\/attributes\/(\d+)\/values$/)
  if (values) return () => addAttributeValue(values[1], body)
  if (key === 'GET /admin/product-types')
    return () => ({ status: 200, body: productTypes.map(productTypeOut) })
  if (key === 'POST /admin/product-types') return () => createProductType(body)
  if (key === 'GET /admin/categories')
    return () => ({ status: 200, body: categories.map(categoryOut) })
  if (key === 'POST /admin/categories') return () => createCategory(body)
  if (key === 'GET /admin/measurement-items') return () => ({ status: 200, body: measurementItems })
  if (key === 'POST /admin/measurement-items') return () => createMeasurementItem(body)
  return null
}
