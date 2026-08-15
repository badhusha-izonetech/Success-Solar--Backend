import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useApi } from '../../api/hooks'
import { apiClient } from '../../api/client'
import { Card, SectionHeading, Pill, PriorityDot, Modal, Field, inputCls } from '../../components/shared/Primitives'
import type { Lead, LeadStatus } from '../../types/models'
import { formatDate } from '../../lib/utils'

const FOLLOW_UP_STATUSES: LeadStatus[] = ['Follow-up', 'Site Visit Required', 'Site Visit Scheduled', 'Interested', 'Contacted']
const NEXT_STATUS: LeadStatus[] = ['Contacted', 'Interested', 'Follow-up', 'Site Visit Required', 'Site Visit Scheduled', 'Quotation Stage', 'Lost']

export default function FollowUps() {
  const { employee, portal } = useAuth()
  
  const { data: leads = [], mutate: refetchLeads } = useApi<Lead[]>('/api/v1/leads/follow-ups')
  const { data: callLogs = [] } = useApi<any[]>('/api/v1/call-logs')
  
  const [active, setActive] = useState<Lead | null>(null)
  const [nextStatus, setNextStatus] = useState<LeadStatus>('Follow-up')
  const [remarks, setRemarks] = useState('')

  const due = useMemo(() => {
    const scoped = portal === 'Telecalling' ? leads.filter((l) => l.assignedEmployeeId === employee?.id) : leads
    return scoped
      .filter((l) => FOLLOW_UP_STATUSES.includes(l.status))
      .sort((a, b) => (a.firstContactDate < b.firstContactDate ? -1 : 1))
  }, [leads, portal, employee])

  function lastCall(leadId: string) {
    return callLogs.filter((c) => c.leadId === leadId).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    
    await apiClient(`/api/v1/leads/${active.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: nextStatus,
        remarks: remarks || undefined,
      })
    })
    
    await refetchLeads()
    setActive(null)
    setRemarks('')
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow={portal === 'Telecalling' ? 'Telecalling' : 'Direct / Field Marketing'}
        title="Follow-up"
        action={<span className="text-xs text-text-dim">{due.length} leads pending follow-up</span>}
      />

      <div className="space-y-3">
        {due.map((l) => {
          const call = lastCall(l.id)
          return (
            <Card key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-text">{l.customerName}</span>
                  <PriorityDot priority={l.priority} />
                  <Pill status={l.status} />
                </div>
                <div className="text-xs text-text-dim mt-0.5">{l.mobile} · {l.productInterested}</div>
                {call ? (
                  <div className="text-xs text-text-dim mt-1">
                    Last call {formatDate(call.date)} ({call.outcome}) — next follow-up {call.nextFollowUpDate ? formatDate(call.nextFollowUpDate) : '—'}
                  </div>
                ) : (
                  <div className="text-xs text-text-dim mt-1">First contact {formatDate(l.firstContactDate)} — no calls logged yet</div>
                )}
              </div>
              <button
                onClick={() => { setActive(l); setNextStatus(l.status) }}
                className="bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors shrink-0"
              >
                Record Outcome
              </button>
            </Card>
          )
        })}
        {due.length === 0 && (
          <Card className="p-8 text-center text-sm text-text-dim">No leads pending follow-up right now.</Card>
        )}
      </div>

      {active && (
        <Modal title={`Record Outcome — ${active.customerName}`} onClose={() => setActive(null)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Move to Status">
              <select className={inputCls} value={nextStatus} onChange={(e) => setNextStatus(e.target.value as LeadStatus)}>
                {NEXT_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Remarks">
              <textarea className={inputCls} rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Notes for this follow-up" />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setActive(null)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
