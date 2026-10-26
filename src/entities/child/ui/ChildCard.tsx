import { BODY_TYPE_LABEL, GENDER_LABEL, PREFERRED_FIT_LABEL, type Child } from '../model/child'
import { ageOf } from '../model/child.rules'
import { sizeRulerOf } from '../model/size-ruler.rules'
import { SizeRulerBar } from './SizeRulerBar'

type ChildCardProps = { child: Child }

/**
 * 자녀 한 명의 프로필 카드: 이름 · 생일 · 키 · 몸무게 · 추천 사이즈 · 키 눈금자 · 체형 · 핏 · 기록 수.
 * 추천 사이즈는 코랄(맞다), 나머지 숫자는 본문색
 */
export function ChildCard({ child }: ChildCardProps) {
  const ruler = sizeRulerOf(child.heightCm)
  const tags = [
    child.bodyType && `체형 ${BODY_TYPE_LABEL[child.bodyType]}`,
    child.preferredFit && `핏 ${PREFERRED_FIT_LABEL[child.preferredFit]}`,
    `성장 기록 ${child.growthRecordCount}건`,
  ].filter((tag): tag is string => Boolean(tag))

  return (
    <article className="border-rule bg-paper space-y-4 rounded-lg border p-4 md:p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-signal-soft text-signal flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold"
        >
          {child.name.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-[17px] font-bold">
            {child.name} <span className="text-ink-3 figure text-xs font-medium">#{child.id}</span>
          </p>
          <p className="text-ink-3 flex flex-wrap gap-x-2 text-[13px]">
            <span className="figure">{child.birthDate.replaceAll('-', '.')}생</span>
            <span>{GENDER_LABEL[child.gender]}</span>
            <span className="figure">만 {ageOf(child.birthDate)}세</span>
          </p>
        </div>
      </div>

      <dl className="border-rule divide-rule grid grid-cols-3 divide-x border-y py-3">
        <div className="space-y-0.5 pr-3">
          <dt className="text-ink-3 text-xs">키</dt>
          <dd className="figure text-ink text-lg font-bold">
            {child.heightCm}
            <span className="text-ink-2 ml-0.5 text-[13px] font-medium">cm</span>
          </dd>
        </div>
        <div className="space-y-0.5 px-3">
          <dt className="text-ink-3 text-xs">몸무게</dt>
          <dd className="figure text-ink text-lg font-bold">
            {child.weightKg}
            <span className="text-ink-2 ml-0.5 text-[13px] font-medium">kg</span>
          </dd>
        </div>
        <div className="space-y-0.5 pl-3">
          <dt className="text-ink-3 text-xs">추천 사이즈</dt>
          <dd className="figure text-fit-ink text-lg font-bold">{ruler.band.size}</dd>
        </div>
      </dl>

      <SizeRulerBar ruler={ruler} name={child.name} />

      <ul className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <li
            key={tag}
            className="bg-paper-2 text-ink-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-medium"
          >
            {tag}
          </li>
        ))}
      </ul>
    </article>
  )
}
