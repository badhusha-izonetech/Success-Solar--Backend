import { useApi } from '../api/hooks'
import { Card, SectionHeading } from '../components/shared/Primitives'

export default function Activity() {
  const { data: activityLogs } = useApi<any[]>('/api/v1/activity')
  if (!activityLogs) return <div className="p-8 text-center text-text-dim text-sm">Loading activity logs...</div>
  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Governance" title="Activity / Audit History" />
      <Card className="p-4">
        <div className="relative pl-5">
          <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
          <div className="space-y-5">
            {activityLogs.map((a) => (
              <div key={a.id} className="relative">
                <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-sun" />
                <div className="text-xs text-text-dim">{a.timestamp} · {a.department}</div>
                <div className="text-sm font-medium mt-0.5">{a.actor} — {a.action}</div>
                <div className="text-xs text-text-dim">{a.entity}</div>
                <div className="text-xs text-text-dim">{a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
