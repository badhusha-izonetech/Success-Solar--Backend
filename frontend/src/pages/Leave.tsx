import { useState } from 'react'
import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, SectionHeading, Pill, Modal, Field, inputCls } from '../components/shared/Primitives'
import { formatDate } from '../lib/utils'
import { Check, X, Plus } from 'lucide-react'

const LEAVE_TYPES = ['Casual', 'Sick', 'Emergency', 'Unpaid']

export default function Leave() {
  const { employee } = useAuth()
  const { data: requests, mutate: refetchRequests } = useApi<any[]>('/api/v1/leave')
  const [showApply, setShowApply] = useState(false)
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Casual',
    fromDate: '',
    toDate: '',
    reason: '',
  })

  async function decide(id: string, status: 'Approved' | 'Rejected') {
    const action = status === 'Approved' ? 'approve' : 'reject'
    await apiClient(`/api/v1/leave/${id}/${action}`, {
      method: 'PATCH',
      body: JSON.stringify({ remarks: status === 'Approved' ? 'Approved by CEO.' : 'Rejected by CEO.' }),
    })
    await refetchRequests()
  }

  async function submitApply(e: React.FormEvent) {
    e.preventDefault()
    if (!applyForm.fromDate || !applyForm.toDate || !applyForm.reason.trim()) return
    await apiClient('/api/v1/leave', {
      method: 'POST',
      body: JSON.stringify({
        leaveType: applyForm.leaveType,
        fromDate: applyForm.fromDate,
        toDate: applyForm.toDate,
        reason: applyForm.reason,
      }),
    })
    await refetchRequests()
    setShowApply(false)
    setApplyForm({ leaveType: 'Casual', fromDate: '', toDate: '', reason: '' })
  }

  const isCeo = employee?.designation === 'CEO'
  const pending = requests?.filter((r) => r.status === 'Pending') || []
  const decided = requests?.filter((r) => r.status !== 'Pending') || []

  if (!requests) return <div className="p-8 text-center text-text-dim text-sm">Loading leave requests...</div>

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Common Module"
        title="Attendance & Leave"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">{pending.length} pending approval</span>
            {!isCeo && (
              <button onClick={() => setShowApply(true)} className="flex items-center gap-1 bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors">
                <Plus size={13} /> Apply Leave
              </button>
            )}
          </div>
        }
      />

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
              {isCeo && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => decide(r.id, 'Approved')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20">
                    <Check size={13} /> Approve
                  </button>
                  <button onClick={() => decide(r.id, 'Rejected')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20">
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
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

      {showApply && (
        <Modal title="Apply for Leave" onClose={() => setShowApply(false)}>
          <form onSubmit={submitApply} className="space-y-4">
            <Field label="Leave Type">
              <select className={inputCls} value={applyForm.leaveType} onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}>
                {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From Date">
                <input required type="date" className={inputCls} value={applyForm.fromDate} onChange={(e) => setApplyForm({ ...applyForm, fromDate: e.target.value })} />
              </Field>
              <Field label="To Date">
                <input required type="date" className={inputCls} value={applyForm.toDate} onChange={(e) => setApplyForm({ ...applyForm, toDate: e.target.value })} />
              </Field>
            </div>
            <Field label="Reason">
              <textarea required className={inputCls} rows={3} value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} placeholder="Reason for leave" />
            </Field>
            {applyForm.leaveType === 'Casual' && (
              <p className="text-[11px] text-sun">Casual leave must be applied at least 3 days in advance.</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowApply(false)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Submit Request</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
