import type { SizeRuler } from '../model/size-ruler.rules'

type SizeRulerBarProps = {
  ruler: SizeRuler
  /** 읽어 주는 문장에 넣을 자녀 이름 */
  name: string
}

/**
 * 키 눈금자 (줄자 모양): 테두리 친 줄자 위에 추천 사이즈 구간을 칠하고 아이 키에 핀을 꽂는다.
 * 아래 숫자는 사이즈 호칭(= 키 cm)이고, 추천 사이즈 숫자만 굵게 밑줄을 긋는다
 */
export function SizeRulerBar({ ruler, name }: SizeRulerBarProps) {
  const ticks: number[] = []
  for (let cm = ruler.fromCm; cm <= ruler.toCm; cm += 5) ticks.push(cm)
  const at = (cm: number) => `${((cm - ruler.fromCm) / (ruler.toCm - ruler.fromCm)) * 100}%`
  return (
    <div
      data-clarity-mask="true"
      role="img"
      aria-label={`${name} 키 ${ruler.heightCm}cm, ${ruler.band.size} 사이즈 구간 ${ruler.band.minCm}~${ruler.band.maxCm}cm`}
      className="relative h-20 w-full select-none"
    >
      {/* 아이 키: 핀 위 이름표 */}
      <span
        aria-hidden
        className="bg-ink text-paper figure absolute top-0 -translate-x-1/2 px-2 text-xs leading-5 font-bold whitespace-nowrap"
        style={{ left: `${ruler.heightPct}%` }}
      >
        {ruler.heightCm}cm
      </span>
      {/* 추천 사이즈 구간 → 줄자 테두리 → 눈금 → 핀 순서로 겹친다 */}
      <span
        aria-hidden
        className="bg-fit absolute top-[26px] h-[30px]"
        style={{
          left: `${ruler.bandStartPct}%`,
          width: `${ruler.bandEndPct - ruler.bandStartPct}%`,
        }}
      />
      <span
        aria-hidden
        className="border-ink absolute top-[26px] right-0 left-0 h-[30px] border-[1.5px]"
      />
      {ticks.map((cm) => (
        <span
          key={cm}
          aria-hidden
          className={
            cm % 10 === 0
              ? 'bg-ink absolute top-[40px] h-[15px] w-px'
              : 'bg-ink absolute top-[47px] h-2 w-px'
          }
          style={{ left: at(cm) }}
        />
      ))}
      <span
        aria-hidden
        className="bg-ink absolute top-5 h-[42px] w-[2.5px] -translate-x-1/2"
        style={{ left: `${ruler.heightPct}%` }}
      />
      {ruler.marks.map((cm) => (
        <span
          key={cm}
          aria-hidden
          className={
            cm === ruler.band.size
              ? 'text-ink figure absolute top-[61px] -translate-x-1/2 text-[13px] font-bold underline decoration-2 underline-offset-[3px]'
              : 'text-ink-2 figure absolute top-[61px] -translate-x-1/2 text-[13px]'
          }
          style={{ left: at(cm) }}
        >
          {cm}
        </span>
      ))}
    </div>
  )
}
