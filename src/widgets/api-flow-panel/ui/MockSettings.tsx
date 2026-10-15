import { useMockSettings } from '@/shared/api'

export function MockSettings() {
  const enabled = useMockSettings((state) => state.enabled)
  const toggle = useMockSettings((state) => state.toggle)
  return (
    <div className="space-y-2 p-1 text-xs">
      <p className="text-muted-foreground">
        백엔드에 아직 없는 API는 목으로 응답해요. 백엔드가 들어오면 해당 도메인을 끄고 실제 서버로
        확인하세요.
      </p>
      {Object.entries(enabled).map(([domain, on]) => (
        <label
          key={domain}
          className="flex items-center justify-between rounded-md border px-2 py-1.5"
        >
          <span className="font-medium">{domain}</span>
          <span className="flex items-center gap-2">
            <span className={on ? 'text-primary' : 'text-muted-foreground'}>
              {on ? '목 사용' : '실제 서버'}
            </span>
            <input type="checkbox" checked={on} onChange={() => toggle(domain)} />
          </span>
        </label>
      ))}
    </div>
  )
}
