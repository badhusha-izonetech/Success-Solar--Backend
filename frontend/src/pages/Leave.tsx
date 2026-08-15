import { useApi } from '../api/hooks'
import { Card, SectionHeading, Pill } from '../components/shared/Primitives'
import { formatDate } from '../lib/utils'
import { Check, X } from 'lucide-react'
export default function Leave() {
  const { data: requests, mutate: refetchRequests } = useApi<any[]>('/api/v1/leave')
  async function decide(id: string, status: 'Approved' | 'Rejected') {
    const action = status === 'Approved' ? 'approve' : 'reject'
    await apiClient(`/api/v1/leave/${id}/${action}`, {
      method: 'PATCH',
      body: JSON.stringify({
        remarks: status === 'Approved' ? 'Approved by CEO.' : 'Rejected by CEO.'
      })
    })
    await refetchRequests()
  }
  const pending = requests?.filter((r) => r.status === 'Pending') || []
  const decided = requests?.filter((r) => r.status !== 'Pending') || []
  
  if (!requests) return <div className="p-8 text-center text-text-dim text-sm">Loading leave requests...</div>
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Common Module" title="Attendance & Leave" action={<span className="text-xs text-text-dim">{pending.length} pending approval</span>} />
      <div>
        <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium mb-2">Pending Requests</div>
        <div className="space-y-2">
          {pending.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.employeeName}</div>
                <div className="text-xs text-text-dim">{r.leaveType} leave · {formatDate(r.fromDate)} – {formatDate(r.toDate)}</div>
                <div className="text-xs text-text-dim mt-0.5">{r.reason}</div>
                {r.leaveType === 'Casual' && (
                  <div className="text-[11px] text-sun mt-1">Casual leave requires 3-day advance notice — applied {formatDate(r.appliedOn)}.</div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => decide(r.id, 'Approved')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20">
                  <Check size={13} /> Approve
                </button>
                <button onClick={() => decide(r.id, 'Rejected')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20">
                  <X size={13} /> Reject
                </button>
              </div>
            </Card>
          ))}
          {pending.length === 0 && <div className="text-sm text-text-dim">No pending leave requests.</div>}
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium mb-2">Decided</div>
        <div className="space-y-2">
          {decided.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.employeeName}</div>
                <div className="text-xs text-text-dim">{r.leaveType} leave · {formatDate(r.fromDate)} – {formatDate(r.toDate)}</div>
                {r.ceoRemarks && <div className="text-xs text-text-dim mt-0.5">{r.ceoRemarks}</div>}
              </div>
              <Pill status={r.status} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
import { apiClient } from '../api/client'
