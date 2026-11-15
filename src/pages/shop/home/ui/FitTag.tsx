import { useId, type ReactNode } from 'react'
import { KidlyLogo } from '@/shared/ui/KidlyLogo'

type FitTagProps = {
  /** 한 문장으로 읽히는 제목 (화면 읽기용) */
  title: string
  /** 손글씨 이름 자리 (자녀 전환 버튼) */
  name: ReactNode
  /** 작은 노란 태그에 적는 추천 사이즈 */
  size: number
  /** 이름 아래 설명 문장 */
  children: ReactNode
  /** 떼는 점선 아래 오른쪽에 두는 링크 */
  footer: ReactNode
}

/** 종이 결: 크라프트지에 깔리는 잔 무늬 */
function KraftSheet() {
  const noiseId = useId()
  const shape = 'M72 0H258L330 56V400H0V56Z'
  return (
    <svg
      viewBox="0 0 330 400"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full"
      aria-hidden
    >
      <defs>
        <filter id={noiseId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" />
          <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 .22 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <path d={shape} fill="var(--shop-kraft)" />
      <path d={shape} filter={`url(#${noiseId})`} />
      <path
        d="M76 10H254L320 61V390H10V61Z"
        fill="none"
        stroke="var(--shop-ink)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * 홈 맞춤 구획의 옷 태그: 끈에 걸린 크라프트지 태그에 「{자녀}에게 맞는 옷」과 설명을 적고,
 * 같은 매듭에서 나온 끈에 추천 사이즈를 적은 작은 노란 태그를 건다.
 * 두 태그는 구멍을 축으로 기울여, 태그 높이가 달라져도 끈이 구멍에서 벗어나지 않는다
 */
export function FitTag({ title, name, size, children, footer }: FitTagProps) {
  return (
    <div
      data-clarity-mask="true"
      className="text-ink relative mx-auto w-[min(21rem,calc(100%-6.5rem))] pt-10 max-lg:-translate-x-10 lg:mx-0 lg:w-[21rem]"
    >
      {/* 위에서 내려와 매듭을 짓고 큰 태그의 구멍으로 들어가는 끈 */}
      <svg
        viewBox="0 0 60 116"
        className="absolute top-[-36px] left-1/2 z-30 h-[116px] w-[60px] -translate-x-1/2"
        fill="none"
        stroke="var(--shop-ink)"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M36 0C20 22 46 40 28 66C22 78 26 92 30 108" />
        <circle cx="28" cy="66" r="4" fill="var(--shop-ink)" stroke="none" />
      </svg>
      {/* 매듭에서 작은 태그의 구멍까지 가는 끈: 폭이 달라져도 양 끝이 맞게 늘어난다 */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute top-[18px] left-[calc(50%-2px)] z-30 h-[98px] w-[calc(50%+34px)]"
        fill="none"
        stroke="var(--shop-ink)"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M0 12C34 -6 88 26 100 100" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative z-10 origin-[50%_35px] -rotate-2 drop-shadow-[5px_6px_0_var(--shop-ink)] lg:-rotate-[4deg]">
        <div className="relative px-7 pt-[62px] pb-5">
          <KraftSheet />
          <span
            aria-hidden
            className="bg-paper absolute top-[22px] left-1/2 size-[26px] -translate-x-1/2 rounded-full border-[5px] border-[#b9b4a6] shadow-[0_0_0_1.5px_var(--shop-ink),inset_0_0_0_1.5px_var(--shop-ink)]"
          />
          <div className="relative">
            <KidlyLogo className="mx-auto mb-4 h-6" />
            <h2
              aria-label={title}
              className="border-ink flex flex-wrap items-baseline gap-x-2 border-b-[1.5px] pb-1 max-lg:pr-6"
            >
              {name}
              <span className="text-[19px] font-extrabold">에게 맞는 옷</span>
            </h2>
            <div className="mt-3.5 text-sm leading-relaxed">{children}</div>
            <div className="border-ink -mx-[17px] mt-4 flex justify-end border-t-2 border-dashed px-[17px] pt-2.5">
              {footer}
            </div>
          </div>
        </div>
      </div>

      {/* 추천 사이즈 태그: 구멍(위쪽 가운데)을 축으로 기울어 끈 끝과 맞는다 */}
      <div className="absolute top-[96px] left-[calc(100%-26px)] z-20 origin-[50%_20px] rotate-[11deg] drop-shadow-[4px_5px_0_var(--shop-ink)]">
        <div className="bg-marker w-[116px] p-1.5 [clip-path:polygon(26%_0,74%_0,100%_15%,100%_100%,0_100%,0_15%)]">
          <div className="border-ink relative border-[1.5px] pt-[30px] pb-2 text-center">
            <span
              aria-hidden
              className="bg-paper border-ink absolute top-2 left-1/2 size-[15px] -translate-x-1/2 rounded-full border-[1.5px]"
            />
            <p className="text-[11px] font-bold">추천 사이즈</p>
            <p className="font-display text-[42px] leading-[1.05]">{size}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
