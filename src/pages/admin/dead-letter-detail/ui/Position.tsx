type PositionProps = { topic: string; partition: number | null; offset: number | null }

/** 토픽 · 파티션 · 오프셋 한 줄 (원래 위치 헤더가 없던 메시지는 파티션 · 오프셋이 없다) */
export function Position({ topic, partition, offset }: PositionProps) {
  return (
    <span className="figure">
      {topic} · 파티션 {partition ?? '-'} · 오프셋 {offset ?? '-'}
    </span>
  )
}
