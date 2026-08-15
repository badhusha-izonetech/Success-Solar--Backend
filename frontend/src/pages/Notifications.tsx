import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import { Card, SectionHeading, Pill } from '../components/shared/Primitives'
import { Bell, CircleDot } from 'lucide-react'

export default function NotificationsPage() {
  const { data: items, mutate: refetchItems } = useApi<any[]>('/api/v1/notifications')
  
  const unread = items?.filter((n) => !n.read).length || 0

  async function markAllRead() {
    await apiClient('/api/v1/notifications/read-all', { method: 'PATCH' })
    refetchItems()
  }

  async function markRead(id: string) {
    await apiClient(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
    refetchItems()
  }

  if (!items) return <div className="p-8 text-center text-text-dim text-sm">Loading notifications...</div>

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Cross-Department"
        title="Notifications"
        action={
          unread > 0 ? (
            <button onClick={markAllRead} className="text-xs text-teal hover:underline">
              Mark all as read
            </button>
          ) : undefined
        }
      />

      <div className="space-y-2">
        {items.map((n) => (
          <Card
            key={n.id}
            className={`p-4 flex items-start gap-3 cursor-pointer ${!n.read ? 'border-sun/30' : ''}`}
            onClick={() => { if (!n.read) markRead(n.id) }}
          >
            <div className="mt-0.5 shrink-0">
              {n.read ? <Bell size={16} className="text-text-dim" /> : <CircleDot size={16} className="text-sun" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`text-sm font-medium ${!n.read ? 'text-text' : 'text-text-dim'}`}>{n.title}</div>
                <Pill status={n.priority} />
                <span className="text-[10px] text-text-dim">{n.department}</span>
              </div>
              <div className="text-xs text-text-dim mt-1">{n.message}</div>
              <div className="text-[10px] text-text-dim mt-1.5">{n.timestamp}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
