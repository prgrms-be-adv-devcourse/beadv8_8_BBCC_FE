// 가짜 백엔드의 관리자 상품 기준 데이터: 실측 항목 만들기와 목록 (BE #405 응답 모양만 흉내).
// 처음 데이터는 BE 초기 데이터 러너의 이름 · 코드를 일부 따른다. 결과는 { status, body } 또는 { status, detail }
const CODE = /^[A-Z_]+$/
let nextId = 1
const measurementItems = [
  { measurementItemId: String(nextId++), name: '총장', code: 'TOTAL_LENGTH', unit: 'cm' },
  { measurementItemId: String(nextId++), name: '어깨너비', code: 'SHOULDER_WIDTH', unit: 'cm' },
]

const blank = (text) => typeof text !== 'string' || !text.trim()
const bad = (detail) => ({ status: 400, detail })
const conflict = { status: 409, detail: '다른 요청과 겹쳤습니다. 잠시 후 다시 시도해 주세요.' }

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
  if (key === 'GET /admin/measurement-items') return () => ({ status: 200, body: measurementItems })
  if (key === 'POST /admin/measurement-items') return () => createMeasurementItem(body)
  return null
}
