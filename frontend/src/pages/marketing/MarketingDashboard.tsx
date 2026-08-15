import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useApi } from '../../api/hooks'
import { Card, KpiCard, SectionHeading, Pill, PriorityDot } from '../../components/shared/Primitives'
import { formatDate } from '../../lib/utils'
import type { Lead, Quotation } from '../../types/models'

export default function MarketingDashboard() {
  const { employee, portal } = useAuth()
  const { data: leads } = useApi<Lead[]>('/api/v1/leads')
  const { data: quotations } = useApi<Quotation[]>('/api/v1/quotations')

  const myLeads = useMemo(() => {
    if (!leads) return []
    return portal === 'Telecalling' ? leads.filter((l) => l.assignedEmployeeId === employee?.id) : leads
  }, [leads, portal, employee])

  const newCount = myLeads.filter((l) => l.status === 'New').length
  const followUpCount = myLeads.filter((l) => l.status === 'Follow-up' || l.status === 'Site Visit Required').length
  const convertedCount = myLeads.filter((l) => l.status === 'Converted').length
  const conversionRate = myLeads.length ? Math.round((convertedCount / myLeads.length) * 100) : 0
  
  const myQuotations = useMemo(() => {
    if (!quotations) return []
    return quotations.filter((q) => q.preparedBy === employee?.name)
  }, [quotations, employee])

  const recent = [...myLeads].sort((a, b) => (a.firstContactDate < b.firstContactDate ? 1 : -1)).slice(0, 6)

  if (!leads || !quotations) return <div className="p-8 text-center text-text-dim text-sm">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={portal === 'Telecalling' ? 'Telecalling' : 'Direct / Field Marketing'}
        title={`Welcome back, ${employee?.name.split(' ')[0]}`}
        action={<span className="text-xs text-text-dim">{formatDate(new Date().toISOString())}</span>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="New Leads" value={String(newCount)} sub="Awaiting first contact" accent="sun" />
        <KpiCard label="Follow-ups Due" value={String(followUpCount)} sub="Needs a call today" accent="rose" />
        <KpiCard label="Converted" value={String(convertedCount)} sub={`${conversionRate}% conversion`} accent="teal" />
        <KpiCard label="Quotations Sent" value={String(myQuotations.length)} sub="Prepared by you" accent="sun" />
      </div>

      <Card className="p-4">
        <SectionHeading
          eyebrow="Pipeline"
          title="Recent leads"
          action={<Link to="/marketing/leads" className="text-xs text-sun hover:underline">View Lead Inbox →</Link>}
        />
        <div className="space-y-2">
          {recent.map((l) => (
            <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 border-t border-border pt-2.5 first:border-t-0 first:pt-0 text-sm">
              <span className="font-medium w-44 shrink-0 truncate">{l.customerName}</span>
              <span className="text-text-dim text-xs w-32 shrink-0">{l.mobile}</span>
              <span className="text-text-dim text-xs flex-1 truncate">{l.productInterested}</span>
              <PriorityDot priority={l.priority} />
              <Pill status={l.status} />
            </div>
          ))}
          {recent.length === 0 && <div className="text-sm text-text-dim py-6 text-center">No leads yet.</div>}
        </div>
      </Card>
    </div>
  )
}
