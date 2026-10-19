import {
  BODY_TYPE_LABEL,
  PREFERRED_FIT_LABEL,
  type Child,
  type ChildForm,
  type GrowthRecord,
  type GrowthSummary,
} from './child'

const hasOneDecimal = (value: number) => Math.round(value * 10) === value * 10

/** 서버 검증과 같은 규칙 (서버 400 문구에는 필드명이 섞여 온다). 문제가 없으면 null */
export function validateChildForm(form: ChildForm, today: string): string | null {
  if (!form.name.trim()) return '이름을 입력해 주세요.'
  if (form.name.trim().length > 50) return '이름은 50자까지예요.'
  if (!form.birthDate || form.birthDate > today) return '생년월일은 오늘이나 그 전이어야 해요.'
  if (!(form.heightCm >= 40 && form.heightCm <= 200)) return '키는 40~200cm 사이로 입력해 주세요.'
  if (!(form.weightKg >= 2 && form.weightKg <= 150)) return '몸무게는 2~150kg 사이로 입력해 주세요.'
  if (!hasOneDecimal(form.heightCm) || !hasOneDecimal(form.weightKg)) {
    return '키 · 몸무게는 소수 첫째 자리까지만 입력할 수 있어요.'
  }
  return null
}

export function findChild(children: Child[] | undefined, childId: string | null): Child | null {
  return children?.find((child) => child.id === childId) ?? null
}

/** 성장 이력 요약: 기록 시각 순으로 처음 → 마지막 키 변화 */
export function summarizeGrowth(records: GrowthRecord[]): GrowthSummary {
  const sorted = [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const first = sorted[0]
  const latest = sorted.at(-1) ?? null
  return {
    count: sorted.length,
    heightChangeCm:
      sorted.length >= 2 && latest
        ? Math.round((latest.heightCm - first.heightCm) * 10) / 10
        : null,
    latest,
  }
}

/** 만 나이 (생일이 지났는지까지 본다) */
export function ageOf(birthDate: string, today: Date = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number)
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1
  return Math.max(0, age)
}

/** 첫 기록 → 마지막 기록 사이 개월 수 (반올림, 최소 1). 기록이 2건 미만이면 null */
export function growthMonths(records: { recordedAt: string }[]): number | null {
  if (records.length < 2) return null
  const times = records.map((record) => Date.parse(record.recordedAt)).sort((a, b) => a - b)
  return Math.max(1, Math.round((times.at(-1)! - times[0]) / (30.44 * 86_400_000)))
}

/** 맞춤 목록 머리말: 키 · 체형 · 선호 핏 (없는 값은 뺀다) */
export function childProfileLine(
  child: Pick<Child, 'heightCm' | 'bodyType' | 'preferredFit'>,
): string {
  return [
    `키 ${child.heightCm}cm`,
    child.bodyType && `체형 ${BODY_TYPE_LABEL[child.bodyType]}`,
    child.preferredFit && `핏 ${PREFERRED_FIT_LABEL[child.preferredFit]}`,
  ]
    .filter(Boolean)
    .join(' · ')
}
