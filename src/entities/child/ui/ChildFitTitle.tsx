type ChildFitTitleProps = {
  name: string
  /** 화면 제목이면 h1, 화면 안 구획 제목이면 h2 */
  as?: 'h1' | 'h2'
}

/**
 * 「{자녀}에게 맞는 옷」 제목: 자녀 이름만 손글씨로 크게 쓰고 형광펜을 칠한다.
 * 이름이 길거나 폭이 좁으면 「에게 맞는 옷」이 아랫줄로 내려간다.
 * 줄이 나뉘어도 한 문장으로 읽히게 aria-label에 온전한 제목을 둔다
 */
export function ChildFitTitle({ name, as: Heading = 'h1' }: ChildFitTitleProps) {
  return (
    <Heading
      aria-label={`${name}에게 맞는 옷`}
      className="flex flex-wrap items-baseline gap-x-[0.3em] gap-y-1 text-[clamp(1.375rem,3vw,2.5rem)] leading-[1.1] font-extrabold"
    >
      <span className="font-hand max-w-full -rotate-3 bg-[linear-gradient(transparent_60%,var(--shop-marker)_60%)] px-[0.06em] text-[2.6em] leading-[0.9] font-bold break-all">
        {name}
      </span>
      <span>에게 맞는 옷</span>
    </Heading>
  )
}
