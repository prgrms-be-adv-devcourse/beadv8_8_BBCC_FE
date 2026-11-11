/** 기준 옷 구분: 상의 · 바지 · 아우터 · 원피스 · 치마 */
export type GarmentPart = 'TOP' | 'BOTTOM' | 'OUTER' | 'DRESS' | 'SKIRT'

/** 화면 · 응답 순서 */
export const GARMENT_PARTS: readonly GarmentPart[] = ['TOP', 'BOTTOM', 'OUTER', 'DRESS', 'SKIRT']

/**
 * 구분마다 필수 · 선택 실측(화면 순서)과 이 구분에 드는 카테고리 이름.
 * 카테고리 경로에 이름이 하나라도 있으면 그 구분이다 (상의를 티셔츠처럼 더 나눠도 상의)
 */
export const GARMENT_PART_SPEC: Record<
  GarmentPart,
  { label: string; required: string[]; optional: string[]; categoryNames: string[] }
> = {
  TOP: {
    label: '상의',
    required: ['TOTAL_LENGTH', 'CHEST_WIDTH'],
    optional: ['SHOULDER_WIDTH', 'SLEEVE_LENGTH'],
    categoryNames: ['상의'],
  },
  BOTTOM: {
    label: '바지',
    required: ['TOTAL_LENGTH', 'WAIST_WIDTH'],
    optional: ['RISE'],
    categoryNames: ['하의', '바지'],
  },
  OUTER: {
    label: '아우터',
    required: ['TOTAL_LENGTH', 'CHEST_WIDTH'],
    optional: ['SHOULDER_WIDTH', 'SLEEVE_LENGTH'],
    categoryNames: ['아우터'],
  },
  DRESS: {
    label: '원피스',
    required: ['TOTAL_LENGTH', 'CHEST_WIDTH'],
    optional: ['SHOULDER_WIDTH'],
    categoryNames: ['원피스'],
  },
  SKIRT: {
    label: '치마',
    required: ['TOTAL_LENGTH', 'WAIST_WIDTH'],
    optional: ['HIP_WIDTH'],
    categoryNames: ['치마'],
  },
}

/** 실측 항목 코드 → 이름 (상품 실측과 같은 코드) */
export const MEASUREMENT_LABEL: Record<string, string> = {
  TOTAL_LENGTH: '총장',
  CHEST_WIDTH: '가슴단면',
  SHOULDER_WIDTH: '어깨너비',
  SLEEVE_LENGTH: '소매길이',
  WAIST_WIDTH: '허리단면',
  RISE: '밑위',
  HIP_WIDTH: '엉덩이단면',
}

export type ReferenceGarmentMeasurement = { code: string; label: string; value: number }

export type ReferenceGarment = {
  part: GarmentPart
  categoryId: string
  /** 구분의 순서(필수 → 선택). 입력하지 않은 선택 실측은 없다 */
  measurements: ReferenceGarmentMeasurement[]
}

/** 입력 중인 기준 옷. categoryId는 고르지 않았으면 '', 실측은 코드 → 입력 글자(비우면 '') */
export type ReferenceGarmentForm = { categoryId: string; measurements: Record<string, string> }
