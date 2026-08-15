import { useMemo, useState } from 'react'
import { Modal, Field, inputCls } from './Primitives'
import { useAuth } from '../../auth/AuthContext'
import { apiClient } from '../../api/client'
import type { Lead, QuotationLineItem } from '../../types/models'
import { formatINR } from '../../lib/utils'

let rowCounter = 1
function emptyRow(): QuotationLineItem {
  return { id: `row${rowCounter++}`, product: '', quantity: 1, unit: 'Nos', unitPrice: 0, discount: 0, gstPercent: 18, labourCharge: 0 }
}

const PROJECT_TYPES = ['Residential Rooftop', 'Commercial Rooftop', 'Industrial', 'Battery Add-on', 'Maintenance']

export function QuotationBuilder({
  lead,
  onClose,
  onCreated,
}: {
  lead?: Lead | null
  onClose: () => void
  onCreated?: () => void
}) {
  const { employee, portal } = useAuth()

  const [customerName, setCustomerName] = useState(lead?.customerName ?? '')
  const [site, setSite] = useState(lead ? `${lead.address}, ${lead.area}` : '')
  const [projectType, setProjectType] = useState(lead?.productInterested ? PROJECT_TYPES[0] : PROJECT_TYPES[0])
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [advancePercentage, setAdvancePercentage] = useState(50)
  const [paymentTerms, setPaymentTerms] = useState('50% advance to confirm order, balance 50% before final connection.')
  const [installationTerms, setInstallationTerms] = useState('Installation within 15 working days of material availability.')
  const [warrantyTerms, setWarrantyTerms] = useState('Panels 25 years performance warranty, inverter 5 years, workmanship 1 year.')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<QuotationLineItem[]>([emptyRow()])

  const isCeo = portal === 'CEO'

  const totals = useMemo(() => {
    let subtotal = 0, discountTotal = 0, taxTotal = 0, labourTotal = 0
    for (const it of items) {
      const lineBase = it.quantity * it.unitPrice
      const lineDiscount = lineBase * (it.discount / 100)
      const lineTaxable = lineBase - lineDiscount
      const lineTax = lineTaxable * (it.gstPercent / 100)
      subtotal += lineBase
      discountTotal += lineDiscount
      taxTotal += lineTax
      labourTotal += it.labourCharge
    }
    const grandTotal = Math.round(subtotal - discountTotal + taxTotal + labourTotal)
    const advanceAmount = Math.round(grandTotal * (advancePercentage / 100))
    return { subtotal, discountTotal, taxTotal, labourTotal, grandTotal, advanceAmount, balanceAmount: grandTotal - advanceAmount }
  }, [items, advancePercentage])

  function updateRow(id: string, patch: Partial<QuotationLineItem>) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!employee || !customerName || !site) return
    
    await apiClient('/api/v1/quotations', {
      method: 'POST',
      body: JSON.stringify({
        customerName,
        site,
        date: new Date().toISOString().slice(0, 10),
        validUntil,
        projectType,
        lineItems: items.filter((it) => it.product.trim().length > 0).map((it) => ({
          product: it.product,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discount: it.discount,
          gstPercent: it.gstPercent,
          labourCharge: it.labourCharge
        })),
        advancePercentage,
        paymentTerms,
        installationTerms,
        warrantyTerms,
        notes,
        leadId: lead?.id,
      })
    })
    
    onCreated?.()
    onClose()
  }

  return (
    <Modal title={lead ? `New Quotation — ${lead.customerName}` : 'New Quotation'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Customer"><input required className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={!!lead} /></Field>
          <Field label="Site"><input required className={inputCls} value={site} onChange={(e) => setSite(e.target.value)} /></Field>
          <Field label="Project Type">
            <select className={inputCls} value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Valid Until"><input type="date" className={inputCls} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium mb-2">Line Items</div>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 items-center bg-panel-raised border border-border rounded-lg p-2">
                <input className={`${inputCls} col-span-2 sm:col-span-2`} placeholder="Product / description" value={it.product} onChange={(e) => updateRow(it.id, { product: e.target.value })} />
                <input type="number" min={0} className={inputCls} placeholder="Qty" value={it.quantity} onChange={(e) => updateRow(it.id, { quantity: Number(e.target.value) })} />
                <input className={inputCls} placeholder="Unit" value={it.unit} onChange={(e) => updateRow(it.id, { unit: e.target.value })} />
                <input type="number" min={0} className={inputCls} placeholder="Unit price" value={it.unitPrice} onChange={(e) => updateRow(it.id, { unitPrice: Number(e.target.value) })} />
                <input type="number" min={0} max={100} className={inputCls} placeholder="Disc %" value={it.discount} onChange={(e) => updateRow(it.id, { discount: Number(e.target.value) })} />
                <input type="number" min={0} className={inputCls} placeholder="Labour ₹" value={it.labourCharge} onChange={(e) => updateRow(it.id, { labourCharge: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems((prev) => [...prev, emptyRow()])} className="text-xs text-sun hover:underline mt-2">+ Add line item</button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Advance %">
            <input type="number" min={0} max={100} className={inputCls} value={advancePercentage} onChange={(e) => setAdvancePercentage(Number(e.target.value))} />
          </Field>
          <div className="sm:col-span-2 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-panel-raised border border-border rounded-lg px-3 py-2"><div className="text-text-dim">Grand Total</div><div className="font-semibold text-text">{formatINR(totals.grandTotal)}</div></div>
            <div className="bg-panel-raised border border-border rounded-lg px-3 py-2"><div className="text-text-dim">Advance / Balance</div><div className="font-semibold text-text">{formatINR(totals.advanceAmount)} / {formatINR(totals.balanceAmount)}</div></div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Payment Terms"><textarea className={inputCls} rows={2} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></Field>
          <Field label="Installation Terms"><textarea className={inputCls} rows={2} value={installationTerms} onChange={(e) => setInstallationTerms(e.target.value)} /></Field>
          <Field label="Warranty Terms"><textarea className={inputCls} rows={2} value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} /></Field>
          <Field label="Notes"><textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>
        </div>

        {isCeo && (
          <div className="text-[11px] text-sun bg-sun/10 border border-sun/30 rounded-lg px-3 py-2">
            Created directly by CEO — this quotation will be marked as CEO-originated in Activity History.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-xs text-text-dim px-3 py-2">Cancel</button>
          <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Save Quotation (Draft)</button>
        </div>
      </form>
    </Modal>
  )
}
