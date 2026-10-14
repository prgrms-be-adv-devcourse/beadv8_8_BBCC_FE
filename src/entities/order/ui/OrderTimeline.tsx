import { formatDateTime } from '@/shared/lib'
import type { OrderTimelineEvent } from '../model/order'

export function OrderTimeline({ events }: { events: OrderTimelineEvent[] }) {
  return (
    <ol className="space-y-2 border-l-2 pl-4">
      {events.map((event, index) => (
        <li key={index} className="text-sm">
          <span className="font-medium">{event.label}</span>{' '}
          <span className="text-muted-foreground">{event.at ? formatDateTime(event.at) : ''}</span>
          {event.note && (
            <div className="text-muted-foreground font-mono text-xs">{event.note}</div>
          )}
        </li>
      ))}
    </ol>
  )
}
