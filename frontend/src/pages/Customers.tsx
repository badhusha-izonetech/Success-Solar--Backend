import { useMemo, useState } from 'react'
import { useApi } from '../api/hooks'
import { Card, SectionHeading, Pill } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import { ExistingCustomerLeadModal } from '../components/shared/ExistingCustomerLeadModal'
import type { ExistingCustomer, Employee } from '../types/models'
import { formatINR, formatDate } from '../lib/utils'
import { useAuth } from '../auth/AuthContext'

export default function Customers() {
  const { employee } = useAuth()
  
  const { data: existingCustomers } = useApi<ExistingCustomer[]>('/api/v1/customers/existing')
  const { data: employees } = useApi<Employee[]>('/api/v1/employees')
  
  const [query, setQuery] = useState('')
  const [enquiryFor, setEnquiryFor] = useState<ExistingCustomer | null>(null)

  const customers = useMemo(() => {
    if (!existingCustomers) return []
    return existingCustomers.filter((c) => c.customerName.toLowerCase().includes(query.toLowerCase()))
  }, [existingCustomers, query])
  
  if (!existingCustomers || !employees) return <div className="p-8 text-center text-text-dim text-sm">Loading customers...</div>

  const columns: Column<ExistingCustomer>[] = [
    { header: 'Customer', cell: (c) => (
      <div>
        <div className="font-medium text-text">{c.customerName}</div>
        <div className="text-xs text-text-dim">{c.mobile}</div>
      </div>
    ) },
    { header: 'Area', cell: (c) => c.area },
    { header: 'Completed Project', cell: (c) => <span className="font-mono text-xs text-teal">{c.completedProjectCode}</span> },
    { header: 'Capacity', cell: (c) => `${c.capacityKw} kW` },
    { header: 'Project Value', cell: (c) => formatINR(c.totalValue) },
    { header: 'Completed On', cell: (c) => <span className="text-text-dim">{formatDate(c.completedOn)}</span> },
    { header: 'Status', cell: () => <Pill status="Completed" /> },
    { header: '', cell: (c) => (
      <button
        onClick={(e) => { e.stopPropagation(); setEnquiryFor(c) }}
        className="text-xs text-sun hover:underline whitespace-nowrap"
      >
        + New Enquiry
      </button>
    ) },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="CEO Portal"
        title="Existing Customers"
        action={<span className="text-xs text-text-dim">{customers.length} customers with a completed project</span>}
      />
      <p className="text-xs text-text-dim -mt-3">
        This list shows only customers whose project has fully reached the <span className="font-medium text-text">Completed</span> stage.
        Customers still in progress appear under <span className="font-medium text-text">Leads</span> and <span className="font-medium text-text">All Projects</span> instead.
        Use "New Enquiry" to start a fresh lead when a completed customer returns for another project.
      </p>
      <Card className="p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search existing customers…"
          className="bg-panel-raised border border-border rounded-lg px-3 py-1.5 text-xs outline-none w-full max-w-sm placeholder:text-text-dim"
        />
      </Card>
      <DataTable
        columns={columns}
        rows={customers}
        keyFn={(c) => c.completedProjectId}
        mobileCard={(c) => (
          <Card className="p-4 space-y-1.5">
            <div className="flex justify-between">
              <div className="font-medium">{c.customerName}</div>
              <Pill status="Completed" />
            </div>
            <div className="text-xs text-text-dim">{c.mobile} · {c.area}</div>
            <div className="text-xs text-text-dim">{c.completedProjectCode} · {c.capacityKw} kW · {formatINR(c.totalValue)}</div>
            <button onClick={() => setEnquiryFor(c)} className="text-xs text-sun hover:underline pt-1">+ New Enquiry</button>
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

      <Card className="p-4 text-xs text-text-dim">
        Marketing employees for reassignment reference: {employees.filter((e) => e.department === 'Marketing').map((e) => e.name).join(', ')}
      </Card>
    </div>
  )
}
