import { useMemo, useState } from 'react'
import { useApi } from '../api/hooks'
import { Card, SectionHeading, Pill, KpiCard } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import type { Payment } from '../types/models'
import { formatINR, formatDate } from '../lib/utils'

const STATE_OPTIONS = ['All States', 'Pending', 'Partial', 'Proof Uploaded', 'Under Verification', 'Verified', 'Rejected']

export default function Payments() {
  const { data: payments } = useApi<Payment[]>('/api/v1/payments')
  
  const [state, setState] = useState('All States')
  const filtered = useMemo(() => {
    if (!payments) return []
    return payments.filter((p) => state === 'All States' || p.state === state)
  }, [state, payments])

  const totalExpected = payments?.reduce((s, p) => s + p.expectedAmount, 0) || 0
  const totalReceived = payments?.reduce((s, p) => s + p.actualAmount, 0) || 0
  const pendingVerification = payments?.filter((p) => p.state === 'Under Verification' || p.state === 'Proof Uploaded').length || 0
  
  if (!payments) return <div className="p-8 text-center text-text-dim text-sm">Loading payments...</div>

  const columns: Column<Payment>[] = [
    { header: 'Customer', cell: (p) => p.customerName },
    { header: 'Type', cell: (p) => <span className="text-text-dim">{p.paymentType}</span> },
    { header: 'Expected', cell: (p) => formatINR(p.expectedAmount) },
    { header: 'Received', cell: (p) => (
      <span className={p.actualAmount < p.expectedAmount ? 'text-sun' : 'text-teal'}>{formatINR(p.actualAmount)}</span>
    ) },
    { header: 'Mode', cell: (p) => p.paymentMode },
    { header: 'Reference', cell: (p) => <span className="font-mono text-[11px] text-text-dim">{p.transactionReference}</span> },
    { header: 'Date', cell: (p) => <span className="text-text-dim">{formatDate(p.paymentDate)}</span> },
    { header: 'State', cell: (p) => <Pill status={p.state} /> },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Accounts" title="Payments" action={<span className="text-xs text-text-dim">{filtered.length} of {payments.length}</span>} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Total Expected" value={formatINR(totalExpected)} accent="sun" />
        <KpiCard label="Total Received" value={formatINR(totalReceived)} accent="teal" />
        <KpiCard label="Awaiting Verification" value={String(pendingVerification)} accent="rose" />
      </div>

      <Card className="p-3 flex flex-wrap gap-2">
        <select value={state} onChange={(e) => setState(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          {STATE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        keyFn={(p) => p.id}
        mobileCard={(p) => (
          <Card className="p-4 space-y-1.5">
            <div className="flex justify-between items-start">
              <div className="font-medium">{p.customerName}</div>
              <Pill status={p.state} />
            </div>
            <div className="text-xs text-text-dim">{p.paymentType} · {p.paymentMode}</div>
            <div className="flex justify-between text-xs">
              <span className="text-text-dim">Expected {formatINR(p.expectedAmount)}</span>
              <span className={p.actualAmount < p.expectedAmount ? 'text-sun' : 'text-teal'}>Received {formatINR(p.actualAmount)}</span>
            </div>
          </Card>
        )}
      />
    </div>
  )
}
