import { useState } from 'react'
import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, SectionHeading, Pill, PriorityDot, Modal, Field, inputCls } from '../components/shared/Primitives'
import { formatDate } from '../lib/utils'
import { Check, X, Plus } from 'lucide-react'

const APPROVAL_TYPES = ['Quotation Revision', 'Stock Purchase Flag', 'Leave Request', 'Project Hold', 'Discount Exception']
const PRIORITIES = ['Low', 'Medium', 'High']

export default function Approvals() {
  const { employee } = useAuth()
  const { data: items, mutate: refetchItems } = useApi<any[]>('/api/v1/approvals')
  const [showRaise, setShowRaise] = useState(false)
  const [raiseForm, setRaiseForm] = useState({
    approvalType: 'Stock Purchase Flag',
    summary: '',
    priority: 'Medium',
  })

  async function decide(id: string, status: 'Approved' | 'Rejected') {
    const action = status === 'Approved' ? 'approve' : 'reject'
    await apiClient(`/api/v1/approvals/${id}/${action}`, {
      method: 'PATCH',
      body: JSON.stringify({ remarks: status === 'Approved' ? 'Approved by CEO.' : 'Rejected by CEO.' }),
    })
    await refetchItems()
  }

  async function submitRaise(e: React.FormEvent) {
    e.preventDefault()
    if (!raiseForm.summary.trim()) return
    await apiClient('/api/v1/approvals', {
      method: 'POST',
      body: JSON.stringify({
        approvalType: raiseForm.approvalType,
        summary: raiseForm.summary,
        priority: raiseForm.priority,
      }),
    })
    await refetchItems()
    setShowRaise(false)
    setRaiseForm({ approvalType: 'Stock Purchase Flag', summary: '', priority: 'Medium' })
  }

  const isCeo = employee?.designation === 'CEO'
  const pending = items?.filter((a) => a.status === 'Pending') || []
  const decided = items?.filter((a) => a.status !== 'Pending') || []

  if (!items) return <div className="p-8 text-center text-text-dim text-sm">Loading approvals...</div>

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CEO Decisions"
        title="Approvals"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">{pending.length} pending</span>
            {!isCeo && (
              <button onClick={() => setShowRaise(true)} className="flex items-center gap-1 bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors">
                <Plus size={13} /> Raise Approval
              </button>
            )}
          </div>
        }
      />

      <div className="space-y-2">
        {pending.map((a) => (
          <Card key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.035] border border-border text-text-dim">{a.approvalType || a.type}</span>
                <PriorityDot priority={a.priority} />
              </div>
              <div className="text-sm font-medium mt-1.5">{a.summary}</div>
              <div className="text-xs text-text-dim mt-0.5">Raised by {a.requestedBy} ({a.department}) · {formatDate(a.raisedOn)}</div>
            </div>
            {isCeo && (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => decide(a.id, 'Approved')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20">
                  <Check size={13} /> Approve
                </button>
                <button onClick={() => decide(a.id, 'Rejected')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20">
                  <X size={13} /> Reject
                </button>
              </div>
            )}
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

      {showRaise && (
        <Modal title="Raise Approval Request" onClose={() => setShowRaise(false)}>
          <form onSubmit={submitRaise} className="space-y-4">
            <Field label="Approval Type">
              <select className={inputCls} value={raiseForm.approvalType} onChange={(e) => setRaiseForm({ ...raiseForm, approvalType: e.target.value })}>
                {APPROVAL_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className={inputCls} value={raiseForm.priority} onChange={(e) => setRaiseForm({ ...raiseForm, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Summary / Description">
              <textarea required className={inputCls} rows={4} value={raiseForm.summary} onChange={(e) => setRaiseForm({ ...raiseForm, summary: e.target.value })} placeholder="Describe what needs CEO approval and why" />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowRaise(false)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Submit</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
