import { useState } from 'react'
import { useApiFlowLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { ApiFlowPanel } from '@/widgets/api-flow-panel'
import { DemoBar } from '@/widgets/demo-bar'

/**
 * 쇼핑 · 판매자 센터 · 관리자용: 시연 막대 + 오른쪽에서 여는 API 흐름 패널.
 * 패널을 닫아도 기록은 계속 쌓인다 (콘솔과 같은 기록)
 */
export function DemoBarWithFlowDrawer() {
  const [open, setOpen] = useState(false)
  const count = useApiFlowLog((state) => state.logs.length)

  return (
    <>
      <DemoBar
        actions={
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={cn(
              'rounded px-2 py-1 text-xs font-semibold',
              open ? 'bg-white text-slate-900' : 'bg-primary text-primary-foreground',
            )}
          >
            API 흐름 {count}
          </button>
        }
      />
      {open && (
        <div className="fixed top-11 right-0 bottom-0 z-40 flex w-[440px] flex-col shadow-2xl">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-muted border-l py-1 text-xs"
          >
            닫기 ✕
          </button>
          <div className="min-h-0 flex-1">
            <ApiFlowPanel />
          </div>
        </div>
      )}
    </>
  )
}
