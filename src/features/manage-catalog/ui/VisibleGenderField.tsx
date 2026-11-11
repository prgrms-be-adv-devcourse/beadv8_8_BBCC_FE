import { VISIBLE_GENDER_LABEL, type CategoryVisibleGender } from '@/entities/catalog'
import { Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

type VisibleGenderFieldProps = {
  value: CategoryVisibleGender
  onChange: (value: CategoryVisibleGender) => void
}

/** 카테고리 「보일 성별」: 모두 · 여아만. 여아만이면 남아 자녀를 고른 보호자에게 이 카테고리와 그 아래가 보이지 않는다 */
export function VisibleGenderField({ value, onChange }: VisibleGenderFieldProps) {
  return (
    <Label>
      보일 성별
      <Select
        className="h-10"
        value={value}
        onChange={(e) => onChange(e.target.value as CategoryVisibleGender)}
      >
        {(Object.keys(VISIBLE_GENDER_LABEL) as CategoryVisibleGender[]).map((gender) => (
          <option key={gender} value={gender}>
            {VISIBLE_GENDER_LABEL[gender]}
          </option>
        ))}
      </Select>
      <span className="text-muted-foreground text-xs font-normal">
        여아만이면 남아 자녀를 고른 보호자에게 이 카테고리와 그 아래가 보이지 않아요.
      </span>
    </Label>
  )
}
