import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useApi } from '../../api/hooks'
import { Card, SectionHeading, Pill, Avatar } from '../../components/shared/Primitives'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { ExistingCustomerLeadModal } from '../../components/shared/ExistingCustomerLeadModal'
import type { ExistingCustomer } from '../../types/models'
import { formatINR, formatDate } from '../../lib/utils'

export default function CustomerList() {
  const { employee, portal } = useAuth()
  const [enquiryFor, setEnquiryFor] = useState<ExistingCustomer | null>(null)
  
  const { data: existingCustomers } = useApi<ExistingCustomer[]>('/api/v1/customers/existing')

  const customers = useMemo(() => existingCustomers || [], [existingCustomers])
  
  if (!existingCustomers) return <div className="p-8 text-center text-text-dim text-sm">Loading customers...</div>

  const columns: Column<ExistingCustomer>[] = [
    { header: 'Customer', cell: (c) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={c.customerName} color="#0f9d68" />
        <div>
          <div className="font-medium text-text">{c.customerName}</div>
          <div className="text-xs text-text-dim">{c.mobile}</div>
        </div>
      </div>
    ) },
    { header: 'Area', cell: (c) => c.area },
    { header: 'Completed Project', cell: (c) => <span className="font-mono text-xs text-teal">{c.completedProjectCode}</span> },
    { header: 'Capacity', cell: (c) => `${c.capacityKw} kW` },
    { header: 'Value', cell: (c) => formatINR(c.totalValue) },
    { header: 'Completed On', cell: (c) => <span className="text-text-dim">{formatDate(c.completedOn)}</span> },
    { header: 'Status', cell: () => <Pill status="Completed" /> },
    { header: '', cell: (c) => (
      <button onClick={(e) => { e.stopPropagation(); setEnquiryFor(c) }} className="text-xs text-sun hover:underline whitespace-nowrap">
        + New Enquiry
      </button>
    ) },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow={portal === 'Telecalling' ? 'Telecalling' : 'Direct / Field Marketing'}
        title="Existing Customers"
        action={<span className="text-xs text-text-dim">{customers.length} completed customers</span>}
      />
      <p className="text-xs text-text-dim -mt-3">
        Only customers with a fully completed project appear here. Start a "New Enquiry" if one of them wants another project — it opens a fresh lead in your inbox.
      </p>

      <DataTable
        columns={columns}
        rows={customers}
        keyFn={(c) => c.completedProjectId}
        mobileCard={(c) => (
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <Avatar name={c.customerName} color="#0f9d68" />
              <div>
                <div className="font-medium">{c.customerName}</div>
                <div className="text-xs text-text-dim">{c.mobile} · {c.area}</div>
              </div>
            </div>
            <div className="text-xs text-text-dim">{c.completedProjectCode} · {c.capacityKw} kW</div>
            <button onClick={() => setEnquiryFor(c)} className="text-xs text-sun hover:underline">+ New Enquiry</button>
          </Card>
        )}
      />

      {enquiryFor && employee && (
        <ExistingCustomerLeadModal
          customer={enquiryFor}
          assignedEmployeeId={employee.id}
          onClose={() => setEnquiryFor(null)}
        />
      )}
    </div>
  )
}
