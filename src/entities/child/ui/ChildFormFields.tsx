import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  BODY_TYPE_LABEL,
  GENDER_LABEL,
  PREFERRED_FIT_LABEL,
  type BodyType,
  type ChildForm,
  type Gender,
  type PreferredFit,
} from '../model/child'
import { sizeRulerOf } from '../model/size-ruler.rules'
import { SizeRulerBar } from './SizeRulerBar'

type ChildFormFieldsProps = {
  form: ChildForm
  onChange: (form: ChildForm) => void
  /** 폼 아래 버튼 · 안내 */
  footer?: ReactNode
}

const LABEL = 'text-ink-2 gap-1.5 text-[13px] font-semibold'
const FIELD = 'h-11 rounded-md text-base'
/** 키가 이 범위면 눈금자로 맞는 사이즈를 미리 보여 준다 (입력 중 값은 건너뛴다) */
const isPreviewHeight = (cm: number) => cm >= 40 && cm <= 200

/**
 * 자녀 입력 칸 (등록 · 수정이 같이 쓴다). 값과 검증은 부르는 쪽이 갖는다.
 * 기본 정보 · 몸 크기(입력하는 대로 키 눈금자) · 맞춤 정보(선택) 세 묶음
 */
export function ChildFormFields({ form, onChange, footer }: ChildFormFieldsProps) {
  const set = <K extends keyof ChildForm>(key: K, value: ChildForm[K]) =>
    onChange({ ...form, [key]: value })

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-ink mb-3 text-sm font-bold">기본 정보</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label className={LABEL}>
            이름
            <Input
              className={FIELD}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </Label>
          <Label className={LABEL}>
            생년월일
            <Input
              type="date"
              className={FIELD}
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
            />
          </Label>
        </div>
        <ChoiceRow
          label="성별"
          options={Object.entries(GENDER_LABEL) as [Gender, string][]}
          value={form.gender}
          onPick={(value) => value && set('gender', value)}
        />
      </fieldset>

      <fieldset className="border-rule space-y-3 border-t pt-5">
        <legend className="text-ink float-left mb-3 w-full text-sm font-bold">몸 크기</legend>
        <div className="clear-both grid grid-cols-2 gap-3">
          <Label className={LABEL}>
            키
            <UnitInput
              unit="cm"
              aria-label="키 (cm)"
              value={form.heightCm}
              onChange={(value) => set('heightCm', value)}
            />
          </Label>
          <Label className={LABEL}>
            몸무게
            <UnitInput
              unit="kg"
              aria-label="몸무게 (kg)"
              value={form.weightKg}
              onChange={(value) => set('weightKg', value)}
            />
          </Label>
        </div>
        {isPreviewHeight(form.heightCm) && (
          <div className="bg-paper-2 space-y-1 rounded-md px-4 pt-3 pb-1">
            <p className="text-ink-2 text-[13px]">
              키 <span className="figure">{form.heightCm}cm</span>면{' '}
              <strong className="text-fit-ink figure font-bold">
                {sizeRulerOf(form.heightCm).band.size}
              </strong>{' '}
              사이즈가 맞아요
            </p>
            <SizeRulerBar ruler={sizeRulerOf(form.heightCm)} name={form.name || '자녀'} />
          </div>
        )}
      </fieldset>

      <fieldset className="border-rule space-y-3 border-t pt-5">
        <legend className="text-ink float-left mb-3 w-full text-sm font-bold">
          맞춤 정보 <span className="text-ink-3 font-medium">(선택)</span>
        </legend>
        <div className="clear-both space-y-3">
          <ChoiceRow
            label="체형"
            options={Object.entries(BODY_TYPE_LABEL) as [BodyType, string][]}
            value={form.bodyType}
            onPick={(value) => set('bodyType', value)}
            canClear
          />
          <ChoiceRow
            label="선호 핏"
            options={Object.entries(PREFERRED_FIT_LABEL) as [PreferredFit, string][]}
            value={form.preferredFit}
            onPick={(value) => set('preferredFit', value)}
            canClear
          />
        </div>
      </fieldset>

      {footer && <div className="flex flex-wrap items-center gap-3 pt-1">{footer}</div>}
    </div>
  )
}

type UnitInputProps = {
  unit: string
  value: number
  onChange: (value: number) => void
  'aria-label': string
}

/** 숫자 칸 + 오른쪽 단위 */
function UnitInput({ unit, value, onChange, 'aria-label': ariaLabel }: UnitInputProps) {
  return (
    <span className="relative block">
      <Input
        type="number"
        step="0.1"
        inputMode="decimal"
        aria-label={ariaLabel}
        className={cn(FIELD, 'figure pr-11')}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span
        aria-hidden
        className="text-ink-3 pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-medium"
      >
        {unit}
      </span>
    </span>
  )
}

type ChoiceRowProps<T extends string> = {
  label: string
  options: [T, string][]
  value: T | null
  onPick: (value: T | null) => void
  /** 고른 칩을 다시 누르면 비운다 (선택 항목) */
  canClear?: boolean
}

/** 몇 개 안 되는 값은 펼친 칩으로 고른다 (선택 칸 대신) */
function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onPick,
  canClear = false,
}: ChoiceRowProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-ink-2 w-14 shrink-0 text-[13px] font-semibold">{label}</span>
      {options.map(([option, text]) => {
        const isPicked = value === option
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isPicked}
            onClick={() => onPick(isPicked && canClear ? null : option)}
            className={cn(
              'h-9 min-w-14 rounded-full border px-4 text-sm font-semibold transition-colors',
              isPicked
                ? 'border-signal bg-signal text-paper'
                : 'border-rule bg-paper text-ink-2 hover:border-field-edge',
            )}
          >
            {text}
          </button>
        )
      })}
    </div>
  )
}
