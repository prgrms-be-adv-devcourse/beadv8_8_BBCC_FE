import { isAxiosError } from 'axios'
import type { CategoryTreeDto } from '@/entities/product'
import {
  GARMENT_PART_SPEC,
  GARMENT_PARTS,
  garmentPartOf,
  isValidMeasurementText,
  measurementCodesOf,
  type GarmentPart,
  type ReferenceGarmentDto,
  type ReferenceGarmentRequestDto,
} from '@/entities/recommendation'
import type { MockHandler, MockRequest, MockResult } from '@/shared/api'
import { fetchReal, loadMockState, problem, saveMockState } from './mock-utils'

// 추천 기준 옷 5칸 (BE 변경 머지 전, FE #280). 자녀별 상의 · 바지 · 아우터 · 원피스 · 치마 한 벌씩
// 탭(sessionStorage)에 둔다. 실제 서버에 저장한 기준 옷과는 따로다. 자녀 · 카테고리는 실제 서버에서 읽어 BE와 같은 오류를 낸다
const KEY = 'reference-garments-five-parts'
const PATH = '/recommendations/children/:childId/reference-garments'
const load = () => loadMockState<Record<string, ReferenceGarmentDto[]>>(KEY, {})
const instance = (request: MockRequest) =>
  `/api/v1/recommendations/children/${request.params.childId}/reference-garments`
const bad = (request: MockRequest, title: string, detail: string) =>
  problem(400, title, detail, instance(request))

/** 자녀를 읽어 남의 자녀면 403, 없으면 404. 읽히면 null */
async function childProblem(request: MockRequest): Promise<MockResult | null> {
  try {
    await fetchReal(request, `/children/${request.params.childId}`)
    return null
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403)
      return problem(
        403,
        '자녀에 접근할 수 없습니다',
        '로그인한 보호자의 자녀만 다룰 수 있습니다.',
        instance(request),
      )
    return problem(404, '자녀를 찾을 수 없습니다', '자녀를 다시 확인해 주세요.', instance(request))
  }
}

function partOf(request: MockRequest): GarmentPart | null {
  return GARMENT_PARTS.find((part) => part === request.params.part) ?? null
}

/** 말단 카테고리 ID → 경로 (예: 의류 > 상의) */
function leafPaths(tree: CategoryTreeDto[], parents: string[] = []): Map<string, string> {
  const paths = new Map<string, string>()
  for (const node of tree) {
    const path = [...parents, node.name]
    if (node.leaf) paths.set(node.categoryId, path.join(' > '))
    else leafPaths(node.children, path).forEach((value, key) => paths.set(key, value))
  }
  return paths
}

async function invalidRequest(
  request: MockRequest,
  part: GarmentPart,
  body: ReferenceGarmentRequestDto,
): Promise<MockResult | null> {
  const tree = await fetchReal<CategoryTreeDto[]>(request, '/categories')
  const path = leafPaths(tree).get(String(body.categoryId))
  if (!path)
    return bad(
      request,
      '확인할 수 없는 세부 종류입니다',
      '기준 옷의 세부 종류를 상품 카테고리에서 다시 골라 주세요.',
    )
  if (garmentPartOf(path) !== part)
    return bad(
      request,
      '구분과 맞지 않는 세부 종류입니다',
      '상의는 상의, 바지는 하의 · 바지, 아우터 · 원피스 · 치마는 같은 이름의 카테고리에서 골라 주세요.',
    )
  const codes = Object.keys(body.measurements)
  if (codes.some((code) => !measurementCodesOf(part).includes(code)))
    return bad(
      request,
      '이 구분에 없는 실측 항목입니다',
      '이 구분에서 입력할 수 있는 실측 항목만 보내 주세요.',
    )
  if (GARMENT_PART_SPEC[part].required.some((code) => !codes.includes(code)))
    return bad(
      request,
      '필수 실측이 없습니다',
      '상의 · 아우터 · 원피스는 총장과 가슴단면, 바지 · 치마는 총장과 허리단면을 입력해 주세요.',
    )
  if (Object.values(body.measurements).some((value) => !isValidMeasurementText(String(value))))
    return bad(
      request,
      '잘못된 실측 값입니다',
      '실측 값은 0cm보다 크고 200cm 이하이며, 소수 첫째 자리까지 입력할 수 있습니다.',
    )
  return null
}

const unknownPart = (request: MockRequest) =>
  bad(
    request,
    '알 수 없는 기준 옷 구분입니다',
    '기준 옷 구분은 TOP · BOTTOM · OUTER · DRESS · SKIRT 중 하나입니다.',
  )

export const recommendHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: PATH,
    handle: async (request) => {
      const failed = await childProblem(request)
      if (failed) return failed
      const list = load()[request.params.childId] ?? []
      // 상의 → 바지 → 아우터 → 원피스 → 치마
      return {
        status: 200,
        data: GARMENT_PARTS.flatMap((part) => list.filter((item) => item.part === part)),
      }
    },
  },
  {
    method: 'PUT',
    path: `${PATH}/:part`,
    handle: async (request) => {
      // BE는 본문 칸 검사가 구분 · 자녀 확인보다 먼저다
      const body = request.body as ReferenceGarmentRequestDto
      if (!body?.categoryId || !body.measurements)
        return bad(request, '잘못된 요청입니다', '세부 종류와 실측을 보내 주세요.')
      const part = partOf(request)
      if (!part) return unknownPart(request)
      const failed = await childProblem(request)
      if (failed) return failed
      const invalid = await invalidRequest(request, part, body)
      if (invalid) return invalid
      const saved: ReferenceGarmentDto = {
        part,
        categoryId: String(body.categoryId),
        measurements: Object.fromEntries(
          Object.entries(body.measurements).map(([code, value]) => [code, Number(value)]),
        ),
      }
      const state = load()
      const others = (state[request.params.childId] ?? []).filter((item) => item.part !== part)
      saveMockState(KEY, { ...state, [request.params.childId]: [...others, saved] })
      return { status: 200, data: saved }
    },
  },
  {
    method: 'DELETE',
    path: `${PATH}/:part`,
    handle: async (request) => {
      const part = partOf(request)
      if (!part) return unknownPart(request)
      const failed = await childProblem(request)
      if (failed) return failed
      const state = load()
      const rest = (state[request.params.childId] ?? []).filter((item) => item.part !== part)
      saveMockState(KEY, { ...state, [request.params.childId]: rest })
      return { status: 204 }
    },
  },
]
