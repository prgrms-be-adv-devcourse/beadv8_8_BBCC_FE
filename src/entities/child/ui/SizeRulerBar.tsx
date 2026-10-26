import type { SizeRuler } from '../model/size-ruler.rules'

type SizeRulerBarProps = {
  ruler: SizeRuler
  /** 읽어 주는 문장에 넣을 자녀 이름 */
  name: string
}

/**
 * 키 눈금자: 추천 사이즈 구간(코랄) 위에 아이 키(자두 핀)를 놓는다.
 * 아래 숫자는 사이즈 호칭(= 키 cm)이고, 추천 사이즈 숫자만 코랄로 굵게 보인다
 */
export function SizeRulerBar({ ruler, name }: SizeRulerBarProps) {
  const ticks: number[] = []
  for (let cm = ruler.fromCm; cm <= ruler.toCm; cm += 5) ticks.push(cm)
  const at = (cm: number) => `${((cm - ruler.fromCm) / (ruler.toCm - ruler.fromCm)) * 100}%`
  return (
    <div
      role="img"
      aria-label={`${name} 키 ${ruler.heightCm}cm, ${ruler.band.size} 사이즈 구간 ${ruler.band.minCm}~${ruler.band.maxCm}cm`}
      className="relative h-14 w-full select-none"
    >
      {/* 아이 키: 핀 위 숫자 */}
      <span
        aria-hidden
        className="text-signal figure absolute top-0 -translate-x-1/2 text-[11px] font-bold whitespace-nowrap"
        style={{ left: `${ruler.heightPct}%` }}
      >
        {ruler.heightCm}cm
      </span>
      <span
        aria-hidden
        className="bg-paper-3 absolute top-[22px] right-0 left-0 h-1.5 rounded-full"
      />
      <span
        aria-hidden
        className="bg-fit absolute top-[22px] h-1.5 rounded-full"
        style={{
          left: `${ruler.bandStartPct}%`,
          width: `${ruler.bandEndPct - ruler.bandStartPct}%`,
        }}
      />
      <span
        aria-hidden
        className="bg-signal ring-paper absolute top-[16px] h-[18px] w-[3px] -translate-x-1/2 rounded-full ring-2"
        style={{ left: `${ruler.heightPct}%` }}
      />
      {ticks.map((cm) => (
        <span
          key={cm}
          aria-hidden
          className={
            cm % 10 === 0
              ? 'bg-ink-3 absolute top-[32px] h-1.5 w-px opacity-60'
              : 'bg-ink-3 absolute top-[32px] h-1 w-px opacity-35'
          }
          style={{ left: at(cm) }}
        />
      ))}
      {ruler.marks.map((cm) => (
        <span
          key={cm}
          aria-hidden
          className={
            cm === ruler.band.size
              ? 'text-fit-ink figure absolute top-[40px] -translate-x-1/2 text-[11px] font-bold'
              : 'text-ink-3 figure absolute top-[40px] -translate-x-1/2 text-[11px]'
          }
          style={{ left: at(cm) }}
        >
          {cm}
        </span>
      ))}
    </div>
  )
}
