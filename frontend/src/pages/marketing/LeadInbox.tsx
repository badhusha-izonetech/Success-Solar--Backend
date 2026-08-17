import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useApi } from '../../api/hooks'
import { apiClient } from '../../api/client'
import { Card, SectionHeading, Pill, PriorityDot, Modal, Field, inputCls } from '../../components/shared/Primitives'
import { DataTable, type Column } from '../../components/shared/DataTable'
import type { Lead, LeadSource, LeadStatus, LostReason, Employee } from '../../types/models'
import { formatDate } from '../../lib/utils'

const STATUS_OPTIONS: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Follow-up', 'Site Visit Required', 'Site Visit Scheduled', 'Quotation Stage', 'Lost', 'Converted']
const LOST_REASONS: LostReason[] = ['Price', 'Product Unavailable', 'Company Cannot Provide Requirement', 'Customer Postponed', 'Competitor', 'Not Interested', 'Technical Infeasibility', 'Other']
const LEAD_SOURCES: LeadSource[] = ['Previous Customer', 'Referral', 'Inquiry Call', 'Walk-in', 'Justdial', 'IndiaMART', 'Google Search', 'BNI', 'Direct Field Visit', 'New Construction', 'Commercial Building', 'Other']

const emptyForm = {
  customerName: '', mobile: '', alternateMobile: '', email: '',
  customerType: 'Residential' as Lead['customerType'],
  address: '', area: '', city: 'Trichy',
  leadSource: 'Walk-in' as LeadSource, sourceReference: '',
  productInterested: '', requirementDescription: '', approximateRequirement: '',
  priority: 'Medium' as Lead['priority'], remarks: '',
}

export default function LeadInbox() {
  const { employee, portal } = useAuth()
  
  const { data: leads, mutate: refetchLeads } = useApi<Lead[]>('/api/v1/leads')
  const { data: employees } = useApi<Employee[]>(portal === 'CEO' ? '/api/v1/employees' : null)
  
  const [status, setStatus] = useState('All Status')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [statusLead, setStatusLead] = useState<Lead | null>(null)
  const [newStatus, setNewStatus] = useState<LeadStatus>('Contacted')
  const [lostReason, setLostReason] = useState<LostReason>('Price')
  const [lostDetail, setLostDetail] = useState('')

  const scoped = useMemo(() => {
    if (!leads) return []
    return portal === 'Telecalling' ? leads.filter((l) => l.assignedEmployeeId === employee?.id) : leads
  }, [leads, portal, employee])
  
  const filtered = useMemo(() => scoped.filter((l) => status === 'All Status' || l.status === status), [scoped, status])

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerName || !form.mobile || !form.productInterested || !employee) return
    
    await apiClient('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        assignedEmployeeId: employee.id,
        firstContactDate: new Date().toISOString().slice(0, 10),
        status: 'New',
        customerOrigin: 'New Lead',
      })
    })
    
    await refetchLeads()
    setForm(emptyForm)
    setShowAdd(false)
  }

  async function submitStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!statusLead) return
    
    await apiClient(`/api/v1/leads/${statusLead.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        ...(newStatus === 'Lost' ? { lostReason, lostReasonDetail: lostDetail } : {})
      })
    })
    
    await refetchLeads()
    setStatusLead(null)
    setLostDetail('')
  }
  
  if (!leads) return <div className="p-8 text-center text-text-dim text-sm">Loading inbox...</div>

  const columns: Column<Lead>[] = [
    { header: 'Customer', cell: (l) => (
      <div>
        <div className="font-medium text-text">{l.customerName}</div>
        <div className="text-xs text-text-dim">{l.mobile} · {l.area}</div>
      </div>
    ) },
    { header: 'Requirement', cell: (l) => <span className="text-text-dim">{l.productInterested}</span> },
    { header: 'Source', cell: (l) => l.leadSource },
    { header: 'Assigned To', cell: (l) => employees.find((e) => e.id === l.assignedEmployeeId)?.name ?? '—' },
    { header: 'Priority', cell: (l) => <PriorityDot priority={l.priority} /> },
    { header: 'Status', cell: (l) => <Pill status={l.status} /> },
    { header: 'First Contact', cell: (l) => <span className="text-text-dim">{formatDate(l.firstContactDate)}</span> },
    { header: '', cell: (l) => (
      <button
        onClick={(e) => { e.stopPropagation(); setStatusLead(l); setNewStatus(l.status) }}
        className="text-xs text-sun hover:underline"
      >
        Update
      </button>
    ) },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow={portal === 'Telecalling' ? 'Telecalling' : 'Direct / Field Marketing'}
        title="Lead Inbox"
        action={
          <button onClick={() => setShowAdd(true)} className="bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors">
            + Add Lead
          </button>
        }
      />

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          <option>All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-text-dim ml-auto">{filtered.length} of {scoped.length} leads</span>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        keyFn={(l) => l.id}
        onRowClick={(l) => { setStatusLead(l); setNewStatus(l.status) }}
        mobileCard={(l) => (
          <Card className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{l.customerName}</div>
                <div className="text-xs text-text-dim">{l.mobile} · {l.area}</div>
              </div>
              <Pill status={l.status} />
            </div>
            <div className="text-xs text-text-dim">{l.productInterested} · {l.leadSource}</div>
            {l.status === 'Lost' && (
              <div className="text-xs text-rose">Lost — {l.lostReason}: {l.lostReasonDetail}</div>
            )}
          </Card>
        )}
      />

      {showAdd && (
        <Modal title="Add New Lead" onClose={() => setShowAdd(false)} wide>
          <form onSubmit={submitLead} className="grid sm:grid-cols-2 gap-4">
            <Field label="Customer Name"><input required className={inputCls} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
            <Field label="Mobile Number"><input required className={inputCls} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
            <Field label="Alternate Number"><input className={inputCls} value={form.alternateMobile} onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })} /></Field>
            <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Customer Type">
              <select className={inputCls} value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value as Lead['customerType'] })}>
                <option>Residential</option><option>Commercial</option><option>Industrial</option>
              </select>
            </Field>
            <Field label="Area / City"><input required className={inputCls} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Thillai Nagar" /></Field>
            <Field label="Address"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="Lead Source">
              <select className={inputCls} value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value as LeadSource })}>
                {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Source Reference"><input className={inputCls} value={form.sourceReference} onChange={(e) => setForm({ ...form, sourceReference: e.target.value })} placeholder="Optional" /></Field>
            <Field label="Product Interested"><input required className={inputCls} value={form.productInterested} onChange={(e) => setForm({ ...form, productInterested: e.target.value })} placeholder="e.g. Rooftop Solar 5kW" /></Field>
            <Field label="Approximate Requirement"><input className={inputCls} value={form.approximateRequirement} onChange={(e) => setForm({ ...form, approximateRequirement: e.target.value })} placeholder="e.g. 5 kW" /></Field>
            <Field label="Priority">
              <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Lead['priority'] })}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Requirement Description">
                <textarea className={inputCls} rows={3} value={form.requirementDescription} onChange={(e) => setForm({ ...form, requirementDescription: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Save Lead</button>
            </div>
          </form>
        </Modal>
      )}

      {statusLead && (
        <Modal title={`Update Status — ${statusLead.customerName}`} onClose={() => setStatusLead(null)}>
          <form onSubmit={submitStatus} className="space-y-4">
            <Field label="Status">
              <select className={inputCls} value={newStatus} onChange={(e) => setNewStatus(e.target.value as LeadStatus)}>
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            {newStatus === 'Lost' && (
              <>
                <Field label="Lost Reason">
                  <select className={inputCls} value={lostReason} onChange={(e) => setLostReason(e.target.value as LostReason)}>
                    {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Reason Detail">
                  <textarea required className={inputCls} rows={3} value={lostDetail} onChange={(e) => setLostDetail(e.target.value)} placeholder="Capture the actual reason given by the customer" />
                </Field>
              </>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setStatusLead(null)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
