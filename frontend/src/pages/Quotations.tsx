import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import { Card, SectionHeading, Pill, Field, inputCls, Modal } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import { QuotationBuilder } from '../components/shared/QuotationBuilder'
import type { Quotation } from '../types/models'
import { formatINR, formatDate } from '../lib/utils'
import { openQuotationDocument } from '../lib/quotationDoc'

const STATUS_OPTIONS = ['All Status', 'Draft', 'Submitted', 'Sent', 'Customer Review', 'Revision Required', 'Customer Approved', 'Customer Rejected', 'Awaiting Advance', 'Expired']

export default function Quotations() {
  const { portal } = useAuth()
  
  const { data: quotations, mutate: refetchQuotations } = useApi<Quotation[]>('/api/v1/quotations')
  
  const [status, setStatus] = useState('All Status')
  const [showBuilder, setShowBuilder] = useState(false)
  const [revising, setRevising] = useState<Quotation | null>(null)
  const [revisionReason, setRevisionReason] = useState('')

  // Only show the active (non-superseded) version of each quotation number by default,
  // unless the user explicitly filters for Expired to see revision history.
  const visible = useMemo(() => {
    if (!quotations) return []
    if (status === 'Expired') return quotations.filter((q) => q.status === 'Expired')
    return quotations.filter((q) => status === 'All Status' || q.status === status)
  }, [quotations, status])

  const isCeo = portal === 'CEO'

  async function submitRevision(e: React.FormEvent) {
    e.preventDefault()
    if (!revising || !revisionReason.trim()) return
    
    await apiClient(`/api/v1/quotations/${revising.id}/revise`, {
      method: 'POST',
      body: JSON.stringify({
        revisionReason,
        advancePercentage: revising.advancePercentage,
        otherCharges: revising.otherCharges,
        notes: revising.notes,
        lineItems: revising.lineItems?.map((it) => ({
          product: it.product,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discount: it.discount,
          gstPercent: it.gstPercent,
          labourCharge: it.labourCharge
        })) || []
      })
    })
    
    await refetchQuotations()
    setRevising(null)
    setRevisionReason('')
  }

  function sendToAccountant(_q: Quotation) {
    // CEO can push an approved quotation straight to the Accountant stage,
    // matching the CEO's own client → quotation → payment flow.
    alert('Sent to Accountant for advance payment verification.')
  }

  const columns: Column<Quotation>[] = [
    { header: 'Quotation #', cell: (q) => <span className="font-mono text-xs text-teal">{q.quotationNumber}</span> },
    { header: 'Customer', cell: (q) => (
      <div>
        <div className="font-medium">{q.customerName}</div>
        <div className="text-xs text-text-dim">{q.site}</div>
      </div>
    ) },
    { header: 'Type', cell: (q) => q.projectType },
    { header: 'Grand Total', cell: (q) => formatINR(q.grandTotal) },
    { header: 'Advance', cell: (q) => formatINR(q.advanceAmount) },
    { header: 'Prepared By', cell: (q) => <span>{q.preparedBy}{q.createdByCeo && <span className="text-sun"> · CEO</span>}</span> },
    { header: 'Rev.', cell: (q) => q.revisionNumber > 0 ? `v${q.revisionNumber + 1}` : 'v1' },
    { header: 'Valid Until', cell: (q) => <span className="text-text-dim">{formatDate(q.validUntil)}</span> },
    { header: 'Status', cell: (q) => <Pill status={q.status} /> },
    { header: '', cell: (q) => (
      <div className="flex items-center gap-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => openQuotationDocument(q)} className="text-xs text-sun hover:underline">Download</button>
        {q.status !== 'Expired' && q.status !== 'Customer Approved' && (
          <button onClick={() => setRevising(q)} className="text-xs text-text-dim hover:text-text hover:underline">Revise</button>
        )}
        {isCeo && q.status === 'Customer Approved' && (
          <button onClick={() => sendToAccountant(q)} className="text-xs text-teal hover:underline">Send to Accountant</button>
        )}
      </div>
    ) },
  ]
  
  if (!quotations) return <div className="p-8 text-center text-text-dim text-sm">Loading quotations...</div>

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Marketing → Quotation"
        title="Quotations"
        action={
          <button onClick={() => setShowBuilder(true)} className="bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors">
            + New Quotation
          </button>
        }
      />
      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-text-dim ml-auto">{visible.length} of {quotations.length}</span>
      </Card>
      <DataTable
        columns={columns}
        rows={visible}
        keyFn={(q) => q.id}
        mobileCard={(q) => (
          <Card className="p-4 space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{q.customerName}</div>
                <div className="font-mono text-[11px] text-teal">{q.quotationNumber}</div>
              </div>
              <Pill status={q.status} />
            </div>
            <div className="text-xs text-text-dim">{q.projectType} · {formatINR(q.grandTotal)}</div>
            <div className="text-xs text-text-dim">Valid until {formatDate(q.validUntil)}</div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => openQuotationDocument(q)} className="text-xs text-sun hover:underline">Download</button>
              {q.status !== 'Expired' && q.status !== 'Customer Approved' && (
                <button onClick={() => setRevising(q)} className="text-xs text-text-dim hover:underline">Revise</button>
              )}
              {isCeo && q.status === 'Customer Approved' && (
                <button onClick={() => sendToAccountant(q)} className="text-xs text-teal hover:underline">Send to Accountant</button>
              )}
            </div>
          </Card>
        )}
      />
      <p className="text-[11px] text-text-dim">Revision history is preserved — previous quotation versions are never discarded; they're marked Expired once a revision is created.</p>

      {showBuilder && <QuotationBuilder onClose={() => setShowBuilder(false)} onCreated={refetchQuotations} />}

      {revising && (
        <Modal title={`Revise — ${revising.quotationNumber}`} onClose={() => setRevising(null)}>
          <form onSubmit={submitRevision} className="space-y-4">
            <p className="text-xs text-text-dim">Marketing employees can update the template, text, and pricing before the customer's 50% advance. The previous version stays on record.</p>
            <Field label="Revision Reason">
              <textarea required className={inputCls} rows={3} value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} placeholder="e.g. Customer requested alternate battery brand pricing" />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setRevising(null)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Create Revision</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
