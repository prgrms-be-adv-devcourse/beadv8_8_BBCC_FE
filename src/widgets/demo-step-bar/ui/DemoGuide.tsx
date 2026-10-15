import { Link, useLocation } from 'react-router'
import { DemoRoleCheck } from '@/features/switch-demo-role'
import { findDemoGuide } from '../model/find-guide'

/** 시연 콘솔 화면 위 안내: 이번 단계 할 일 · 흐름 패널에서 볼 것 · 다음 화면 */
export function DemoGuide() {
  const { pathname } = useLocation()
  const guide = findDemoGuide(pathname)
  if (!guide) {
    return null
  }

  return (
    <section
      aria-label="시연 안내"
      className="border-primary/30 bg-primary/5 mb-5 space-y-2 rounded-xl border px-4 py-3 text-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs font-bold">
          {guide.step}
        </span>
        {guide.actor && <span className="text-xs font-semibold">{guide.actor} 화면</span>}
        {guide.actor && <DemoRoleCheck label={guide.actor} />}
      </div>
      <ol className="list-inside list-decimal space-y-0.5">
        {guide.todo.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <p className="text-muted-foreground text-xs">
        <span className="text-foreground font-semibold">흐름 패널 </span>
        {guide.watch}
      </p>
      {guide.next && (
        <div className="flex justify-end">
          <Link to={guide.next.to} className="text-primary text-xs font-semibold hover:underline">
            다음: {guide.next.label} →
          </Link>
        </div>
      )}
    </section>
  )
}
