/**
 * 자녀의 키 성장 속도 (BE #1266). cmPerMonth는 최종으로 쓴 한 달 성장량, recentCmPerMonth는 최근 3개월
 * 속도(기록이 부족하면 null). childSharePercent는 아이 기록 비중(%, 평균 표 값만 썼으면 0)
 */
export type GrowthSpeed = {
  cmPerMonth: number
  recentCmPerMonth: number | null
  recordCount: number
  recordMonths: number
  childSharePercent: number
  tableCmPerMonth: number
  /** 또래 평균 표 출처 (예: 한국아동패널) */
  tableSource: string
}

/** 사이즈 하나를 앞으로 입을 수 있는 개월 수 (0 ~ 24). 키 기준 · 너비 기준 · 둘 중 짧은 값, 계산할 수 없으면 null */
export type WearablePeriod = {
  size: string
  lengthMonths: number | null
  widthMonths: number | null
  months: number | null
}
