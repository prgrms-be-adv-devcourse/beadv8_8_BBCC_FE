import { cn } from '@/shared/lib'

type KidlyLogoProps = {
  /** 높이를 정한다 (예: h-9). 폭은 비율대로 따라온다 */
  className?: string
}

/** 획 위쪽의 반짝임 한 벌: 짧은 곡선과 그 아래 점 */
function glintOf(centerX: number, top: number): { arc: string; dot: [number, number] } {
  return {
    arc: `M${centerX - 7} ${top + 17}Q${centerX - 7} ${top + 7} ${centerX + 3} ${top + 6}`,
    dot: [centerX - 7, top + 25],
  }
}

// 글자 기둥마다 하나씩: K · i · d · l · y의 두 갈래
const STEM_GLINTS = [
  glintOf(37, 22),
  glintOf(111, 20),
  glintOf(184, 20),
  glintOf(211, 20),
  glintOf(242, 49),
  glintOf(277, 49),
]
// K의 팔 · d의 둥근 배 · y의 꼬리
const EXTRA_ARCS = ['M74 34Q78 28 86 28', 'M137 78Q139 68 148 66', 'M236 120Q238 127 246 127']

/**
 * Kidly 로고: 통통한 먹색 글자 위에 흰 반짝임을 얹는다.
 * 글자는 로고 글꼴(Bagel Fat One)로 쓰고, 반짝임 자리는 그 글꼴의 글자 폭에 맞춰 두었다
 */
export function KidlyLogo({ className }: KidlyLogoProps) {
  return (
    <svg
      role="img"
      aria-label="Kidly"
      viewBox="14 10 284 132"
      className={cn('font-logo w-auto shrink-0', className)}
    >
      <text x="20" y="110" fontSize="120" fill="currentColor">
        Kidly
      </text>
      <g fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round">
        {STEM_GLINTS.map((glint) => (
          <path key={glint.arc} d={glint.arc} />
        ))}
        {EXTRA_ARCS.map((arc) => (
          <path key={arc} d={arc} />
        ))}
      </g>
      <g fill="#fff">
        {STEM_GLINTS.map((glint) => (
          <circle key={glint.arc} cx={glint.dot[0]} cy={glint.dot[1]} r="3" />
        ))}
      </g>
    </svg>
  )
}
