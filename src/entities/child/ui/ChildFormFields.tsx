import type { ReactNode } from 'react'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  BODY_TYPE_LABEL,
  PREFERRED_FIT_LABEL,
  type BodyType,
  type ChildForm,
  type Gender,
  type PreferredFit,
} from '../model/child'

type Props = {
  form: ChildForm
  onChange: (form: ChildForm) => void
  /** 폼 아래 버튼 · 안내 */
  footer?: ReactNode
}

/** 자녀 입력 칸 (등록 · 수정이 같이 쓴다). 값과 검증은 부르는 쪽이 갖는다 */
export function ChildFormFields({ form, onChange, footer }: Props) {
  const set = <K extends keyof ChildForm>(key: K, value: ChildForm[K]) =>
    onChange({ ...form, [key]: value })

  return (
    <div className="grid grid-cols-2 gap-3">
      <Label>
        이름
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
      </Label>
      <Label>
        생년월일
        <Input
          type="date"
          value={form.birthDate}
          onChange={(e) => set('birthDate', e.target.value)}
        />
      </Label>
      <Label>
        성별
        <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
          <option value="MALE">남</option>
          <option value="FEMALE">여</option>
        </Select>
      </Label>
      <Label>
        키 (cm)
        <Input
          type="number"
          step="0.1"
          value={form.heightCm}
          onChange={(e) => set('heightCm', Number(e.target.value))}
        />
      </Label>
      <Label>
        몸무게 (kg)
        <Input
          type="number"
          step="0.1"
          value={form.weightKg}
          onChange={(e) => set('weightKg', Number(e.target.value))}
        />
      </Label>
      <Label>
        체형 (선택)
        <Select
          value={form.bodyType ?? ''}
          onChange={(e) => set('bodyType', (e.target.value || null) as BodyType | null)}
        >
          <option value="">입력 안 함</option>
          {Object.entries(BODY_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Label>
      <Label>
        선호 핏 (선택)
        <Select
          value={form.preferredFit ?? ''}
          onChange={(e) => set('preferredFit', (e.target.value || null) as PreferredFit | null)}
        >
          <option value="">입력 안 함</option>
          {Object.entries(PREFERRED_FIT_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Label>
      {footer && <div className="col-span-2 flex items-center gap-3">{footer}</div>}
    </div>
  )
}
