import { useApi } from '../api/hooks'
import { Card, SectionHeading, Pill, PriorityDot } from '../components/shared/Primitives'
import { formatDate } from '../lib/utils'
import { Check, X } from 'lucide-react'
export default function Approvals() {
  const { data: items, mutate: refetchItems } = useApi<any[]>('/api/v1/approvals')
  async function decide(id: string, status: 'Approved' | 'Rejected') {
    const action = status === 'Approved' ? 'approve' : 'reject'
    await apiClient(`/api/v1/approvals/${id}/${action}`, {
      method: 'PATCH',
      body: JSON.stringify({
        remarks: status === 'Approved' ? 'Approved by CEO.' : 'Rejected by CEO.'
      })
    })
    await refetchItems()
  }
  const pending = items?.filter((a) => a.status === 'Pending') || []
  const decided = items?.filter((a) => a.status !== 'Pending') || []
  
  if (!items) return <div className="p-8 text-center text-text-dim text-sm">Loading approvals...</div>
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="CEO Decisions" title="Approvals" action={<span className="text-xs text-text-dim">{pending.length} pending</span>} />
      <div className="space-y-2">
        {pending.map((a) => (
          <Card key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.035] border border-border text-text-dim">{a.type}</span>
                <PriorityDot priority={a.priority} />
              </div>
              <div className="text-sm font-medium mt-1.5">{a.summary}</div>
              <div className="text-xs text-text-dim mt-0.5">Raised by {a.requestedBy} ({a.department}) · {formatDate(a.raisedOn)}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => decide(a.id, 'Approved')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20">
                <Check size={13} /> Approve
              </button>
              <button onClick={() => decide(a.id, 'Rejected')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20">
                <X size={13} /> Reject
              </button>
            </div>
          </Card>
        ))}
        {pending.length === 0 && <div className="text-sm text-text-dim">No pending approvals.</div>}
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium mb-2">Decided</div>
        <div className="space-y-2">
          {decided.map((a) => (
            <Card key={a.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm">{a.summary}</div>
                <div className="text-xs text-text-dim">{a.requestedBy} · {a.department}</div>
              </div>
              <Pill status={a.status} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
import { apiClient } from '../api/client'
