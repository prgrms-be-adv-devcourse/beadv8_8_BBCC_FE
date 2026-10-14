import type { Child, ChildForm, GrowthRecord, GrowthSummary } from './child'

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
