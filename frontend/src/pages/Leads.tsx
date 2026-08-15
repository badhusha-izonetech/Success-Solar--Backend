import { useMemo, useState } from 'react'
import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, SectionHeading, Pill, PriorityDot, Modal, Field, inputCls } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import { QuotationBuilder } from '../components/shared/QuotationBuilder'
import type { Lead, LeadSource, Employee } from '../types/models'
import { formatDate } from '../lib/utils'

const STATUS_OPTIONS = ['All Status', 'New', 'Contacted', 'Interested', 'Follow-up', 'Site Visit Required', 'Site Visit Scheduled', 'Quotation Stage', 'Lost', 'Converted']
const LEAD_SOURCES: LeadSource[] = ['Previous Customer', 'Referral', 'Inquiry Call', 'Walk-in', 'Justdial', 'IndiaMART', 'Google Search', 'BNI', 'Direct Field Visit', 'New Construction', 'Commercial Building', 'Other']

const emptyForm = {
  customerName: '', mobile: '', alternateMobile: '', email: '',
  customerType: 'Residential' as Lead['customerType'],
  address: '', area: '', city: 'Trichy',
  leadSource: 'Walk-in' as LeadSource, sourceReference: '',
  productInterested: '', requirementDescription: '', approximateRequirement: '',
  priority: 'Medium' as Lead['priority'], remarks: '',
  assignedEmployeeId: '',
}

export default function Leads() {
  const { employee } = useAuth()
  
  const { data: leads, mutate: refetchLeads } = useApi<Lead[]>('/api/v1/leads')
  const { data: employees } = useApi<Employee[]>('/api/v1/employees')
  
  const [tab, setTab] = useState<'my' | 'all'>('all')
  const [status, setStatus] = useState('All Status')
  const [source, setSource] = useState('All Sources')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null)
  const [assignTo, setAssignTo] = useState('')
  const [quotationLead, setQuotationLead] = useState<Lead | null>(null)

  const marketingEmployees = useMemo(() => {
    if (!employees) return []
    return employees.filter((e) => e.department === 'Marketing' && e.employmentStatus === 'Active')
  }, [employees])

  const SOURCE_OPTIONS = useMemo(() => {
    if (!leads) return ['All Sources']
    return ['All Sources', ...Array.from(new Set(leads.map((l) => l.leadSource)))]
  }, [leads])

  const scoped = useMemo(() => {
    if (!leads) return []
    return tab === 'my' ? leads.filter((l) => l.createdById === employee?.id) : leads
  }, [leads, tab, employee])
  
  const filtered = useMemo(
    () => scoped.filter((l) => (status === 'All Status' || l.status === status) && (source === 'All Sources' || l.leadSource === source)),
    [scoped, status, source]
  )

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerName || !form.mobile || !form.productInterested || !employee) return
    
    const assignedId = form.assignedEmployeeId || (marketingEmployees[0]?.id ?? '')
    
    await apiClient('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        assignedEmployeeId: assignedId,
        firstContactDate: new Date().toISOString().slice(0, 10),
        status: 'New',
        customerOrigin: 'New Lead',
      }),
    })
    
    await refetchLeads()
    setForm({ ...emptyForm })
    setShowAdd(false)
    setTab('my')
  }

  async function submitAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!assigningLead || !assignTo) return
    
    await apiClient(`/api/v1/leads/${assigningLead.id}/reassign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedEmployeeId: assignTo })
    })
    
    await refetchLeads()
    setAssigningLead(null)
  }

  if (!leads || !employees) return <div className="p-8 text-center text-text-dim text-sm">Loading leads...</div>

  const columns: Column<Lead>[] = [
    { header: 'Customer', cell: (l) => (
      <div>
        <div className="font-medium text-text">{l.customerName}</div>
        <div className="text-xs text-text-dim">{l.mobile} · {l.area}</div>
      </div>
    ) },
    { header: 'Requirement', cell: (l) => <span className="text-text-dim">{l.productInterested}</span> },
    { header: 'Source', cell: (l) => l.leadSource },
    { header: 'Assigned To', cell: (l) => (
      <div className="flex items-center gap-2">
        <span>{employees.find((e) => e.id === l.assignedEmployeeId)?.name ?? '—'}</span>
        <button onClick={(e) => { e.stopPropagation(); setAssigningLead(l); setAssignTo(l.assignedEmployeeId) }} className="text-[10px] text-sun hover:underline">Reassign</button>
      </div>
    ) },
    { header: 'Priority', cell: (l) => <PriorityDot priority={l.priority} /> },
    { header: 'Status', cell: (l) => <Pill status={l.status} /> },
    { header: 'First Contact', cell: (l) => <span className="text-text-dim">{formatDate(l.firstContactDate)}</span> },
    { header: '', cell: (l) => (
      <button onClick={(e) => { e.stopPropagation(); setQuotationLead(l) }} className="text-xs text-teal hover:underline whitespace-nowrap">
        Create Quotation
      </button>
    ) },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="CEO Portal"
        title="Leads / Clients"
        action={
          <button onClick={() => setShowAdd(true)} className="bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors">
            + New Client
          </button>
        }
      />

      <div className="flex gap-1 bg-panel-raised border border-border rounded-lg p-1 w-fit">
        <button onClick={() => setTab('my')} className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${tab === 'my' ? 'bg-sun text-ink' : 'text-text-dim hover:text-text'}`}>My Clients</button>
        <button onClick={() => setTab('all')} className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${tab === 'all' ? 'bg-sun text-ink' : 'text-text-dim hover:text-text'}`}>All Clients</button>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          {SOURCE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-text-dim ml-auto">{filtered.length} of {scoped.length}</span>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        keyFn={(l) => l.id}
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
            <div className="text-xs text-text-dim">Assigned: {employees.find((e) => e.id === l.assignedEmployeeId)?.name ?? '—'}</div>
            {l.status === 'Lost' && (
              <div className="text-xs text-rose">Lost — {l.lostReason}: {l.lostReasonDetail}</div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setAssigningLead(l); setAssignTo(l.assignedEmployeeId) }} className="text-xs text-sun hover:underline">Reassign</button>
              <button onClick={() => setQuotationLead(l)} className="text-xs text-teal hover:underline">Create Quotation</button>
            </div>
          </Card>
        )}
      />

      <Card className="p-4">
        <SectionHeading eyebrow="Detail" title="Lost lead reasons" />
        <div className="space-y-2">
          {leads.filter((l) => l.status === 'Lost').map((l) => (
            <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-t border-border pt-2 first:border-t-0 first:pt-0">
              <span className="font-medium w-40 shrink-0">{l.customerName}</span>
              <Pill status={l.lostReason ?? 'Other'} />
              <span className="text-text-dim text-xs">{l.lostReasonDetail}</span>
            </div>
          ))}
        </div>
      </Card>

      {showAdd && (
        <Modal title="New Client" onClose={() => setShowAdd(false)} wide>
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
            <Field label="Product Interested"><input required className={inputCls} value={form.productInterested} onChange={(e) => setForm({ ...form, productInterested: e.target.value })} placeholder="e.g. Rooftop Solar 5kW" /></Field>
            <Field label="Approximate Requirement"><input className={inputCls} value={form.approximateRequirement} onChange={(e) => setForm({ ...form, approximateRequirement: e.target.value })} placeholder="e.g. 5 kW" /></Field>
            <Field label="Priority">
              <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Lead['priority'] })}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </Field>
            <Field label="Assign To Marketing Employee">
              <select className={inputCls} value={form.assignedEmployeeId || (marketingEmployees[0]?.id ?? '')} onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value })}>
                {marketingEmployees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.designation}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Requirement Description">
                <textarea className={inputCls} rows={3} value={form.requirementDescription} onChange={(e) => setForm({ ...form, requirementDescription: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Save Client</button>
            </div>
          </form>
        </Modal>
      )}

      {assigningLead && (
        <Modal title={`Assign — ${assigningLead.customerName}`} onClose={() => setAssigningLead(null)}>
          <form onSubmit={submitAssign} className="space-y-4">
            <Field label="Marketing Employee">
              <select className={inputCls} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                {marketingEmployees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.designation}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setAssigningLead(null)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Assign Lead</button>
            </div>
          </form>
        </Modal>
      )}

      {quotationLead && <QuotationBuilder lead={quotationLead} onClose={() => setQuotationLead(null)} />}
    </div>
  )
}
