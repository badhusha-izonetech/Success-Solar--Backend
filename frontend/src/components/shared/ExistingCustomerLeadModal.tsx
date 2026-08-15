import { useState } from 'react'
import { Modal, Field, inputCls } from './Primitives'
import { apiClient } from '../../api/client'
import type { Lead, ExistingCustomer } from '../../types/models'

export function ExistingCustomerLeadModal({
  customer,
  assignedEmployeeId,
  onClose,
  onCreated,
}: {
  customer: ExistingCustomer
  assignedEmployeeId: string
  onClose: () => void
  onCreated?: (lead: Lead) => void
}) {
  const [productInterested, setProductInterested] = useState('')
  const [requirementDescription, setRequirementDescription] = useState('')
  const [approximateRequirement, setApproximateRequirement] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!productInterested) return
    
    const lead = await apiClient<Lead>('/api/v1/leads/existing-customer', {
      method: 'POST',
      body: JSON.stringify({
        customerId: customer.customerId,
        priorProjectId: customer.completedProjectId,
        productInterested,
        requirementDescription,
        approximateRequirement,
        priority: 'Medium',
        assignedEmployeeId,
        leadSource: 'Previous Customer'
      })
    })
    
    onCreated?.(lead)
    onClose()
  }

  return (
    <Modal title={`New Enquiry — ${customer.customerName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="text-xs text-text-dim bg-panel-raised border border-border rounded-lg px-3 py-2">
          Existing customer, completed project <span className="font-medium text-text">{customer.completedProjectCode}</span> ({customer.capacityKw} kW). This creates a fresh lead for their new requirement — it will not affect the completed project record.
        </div>
        <Field label="Product / Requirement Interested">
          <input required className={inputCls} value={productInterested} onChange={(e) => setProductInterested(e.target.value)} placeholder="e.g. Battery Backup Add-on, 5kWh" />
        </Field>
        <Field label="Approximate Requirement">
          <input className={inputCls} value={approximateRequirement} onChange={(e) => setApproximateRequirement(e.target.value)} placeholder="e.g. 5 kWh battery" />
        </Field>
        <Field label="Notes">
          <textarea className={inputCls} rows={3} value={requirementDescription} onChange={(e) => setRequirementDescription(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-xs text-text-dim px-3 py-2">Cancel</button>
          <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Create Lead</button>
        </div>
      </form>
    </Modal>
  )
}
