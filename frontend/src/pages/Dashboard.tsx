import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from 'recharts'
import { useAuth } from '../auth/AuthContext'
import { useApi } from '../api/hooks'
import type { Project, Lead, Payment, StockItem, Employee } from '../types/models'
import { Card, KpiCard, SectionHeading, Pill } from '../components/shared/Primitives'
import { StageArc } from '../components/shared/StageArc'
import { formatINR, formatDate } from '../lib/utils'
import { AlertTriangle, TrendingUp, Filter } from 'lucide-react'

const PRIORITY_OPTIONS = ['All Priorities', 'High', 'Medium', 'Low']
const STATUS_OPTIONS = ['All Status', 'On Track', 'Delayed', 'On Hold', 'Completed', 'Issue Raised']

export default function Dashboard() {
  const { employee } = useAuth()
  const { data: projects = [] } = useApi<Project[]>('/api/v1/projects')
  const { data: leads = [] } = useApi<Lead[]>('/api/v1/leads')
  const { data: payments = [] } = useApi<Payment[]>('/api/v1/payments')
  const { data: stockItems = [] } = useApi<StockItem[]>('/api/v1/stock')
  const { data: employees = [] } = useApi<Employee[]>('/api/v1/employees')
  const { data: approvals = [] } = useApi<any[]>('/api/v1/approvals')

  const AREA_OPTIONS = useMemo(() => ['All Areas', ...Array.from(new Set(projects.map((p) => p.area)))], [projects])

  const [area, setArea] = useState('All Areas')
  const [priority, setPriority] = useState('All Priorities')
  const [status, setStatus] = useState('All Status')

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          (area === 'All Areas' || p.area === area) &&
          (priority === 'All Priorities' || p.priority === priority) &&
          (status === 'All Status' || p.status === status),
      ),
    [area, priority, status, projects],
  )

  const totalPipelineValue = filteredProjects.reduce((s, p) => s + p.projectValue, 0)
  const outstanding = filteredProjects.reduce((s, p) => s + p.balanceAmount, 0)
  const activeProjects = filteredProjects.filter((p) => p.status !== 'Completed').length
  const delayedCount = filteredProjects.filter((p) => p.status === 'Delayed' || p.status === 'Issue Raised').length
  const convertedLeads = leads.filter((l) => l.status === 'Converted').length
  const conversionRate = leads.length ? Math.round((convertedLeads / leads.length) * 100) : 0
  const lowStock = stockItems.filter((s) => s.availableQuantity <= s.minimumLevel)
  const pendingApprovals = approvals.filter((a) => a.status === 'Pending').length
  const verifiedThisWeek = payments.filter((p) => p.state === 'Verified').reduce((s, p) => s + p.actualAmount, 0)

  const stageChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredProjects.forEach((p) => {
      counts[p.currentStage] = (counts[p.currentStage] ?? 0) + 1
    })
    return Object.entries(counts).map(([stage, count]) => ({ stage, count }))
  }, [filteredProjects])

  const leadSourceData = useMemo(() => {
    const counts: Record<string, number> = {}
    leads.forEach((l) => {
      counts[l.leadSource] = (counts[l.leadSource] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [leads])

  const PIE_COLORS = ['#f2a93b', '#2fb8a8', '#e2635f', '#d8842a', '#1f8c80', '#97a3b3', '#c9974f']

  const activeCount = employees.filter((e) => e.employmentStatus === 'Active').length
  const onFieldCount = employees.filter((e) => e.location).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-wider text-sun font-semibold">Executive Overview</div>
        <h1 className="text-2xl font-display font-semibold">Good afternoon, {employee?.name.split(' ')[0] || 'User'}.</h1>
        <p className="text-sm text-text-dim">Here's where Success Solar Care stands across every department today, 14 Aug 2026.</p>
      </div>

      {/* Filters */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-text-dim text-xs pr-1">
          <Filter size={13} /> Filters
        </div>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text outline-none">
          {AREA_OPTIONS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text outline-none">
          {PRIORITY_OPTIONS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text outline-none">
          {STATUS_OPTIONS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <span className="text-xs text-text-dim ml-auto">{filteredProjects.length} of {projects.length} projects shown</span>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Active Pipeline Value" value={formatINR(totalPipelineValue)} sub={`${activeProjects} active projects`} accent="sun" />
        <KpiCard label="Outstanding Balance" value={formatINR(outstanding)} sub="Across filtered projects" accent="rose" />
        <KpiCard label="Lead Conversion" value={`${conversionRate}%`} sub={`${convertedLeads} of ${leads.length} leads converted`} accent="teal" />
        <KpiCard label="Verified Collections" value={formatINR(verifiedThisWeek)} sub="Verified by accounts this week" accent="teal" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Delayed / Issue Projects" value={String(delayedCount)} sub="Needs CEO attention" accent="rose" />
        <KpiCard label="Low Stock Items" value={String(lowStock.length)} sub="Below minimum level" accent="rose" />
        <KpiCard label="Pending Approvals" value={String(pendingApprovals)} sub="Awaiting CEO decision" accent="sun" />
        <KpiCard label="Staff Active / On Field" value={`${activeCount} / ${onFieldCount}`} sub="Live headcount today" accent="teal" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <SectionHeading eyebrow="Workflow" title="Projects by current stage" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stageChartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="stage" tick={{ fill: '#97a3b3', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#97a3b3', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1c2530', border: '1px solid #2a3542', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#f2a93b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <SectionHeading eyebrow="Marketing" title="Leads by source" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={leadSourceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {leadSourceData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1c2530', border: '1px solid #2a3542', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <SectionHeading eyebrow="Live" title="Active project stage map" />
          <div className="flex flex-wrap gap-4">
            {filteredProjects.filter((p) => p.status !== 'Completed').map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2 bg-panel-raised rounded-lg p-3 border border-border w-[150px]">
                <StageArc stage={p.currentStage} size="sm" />
                <div className="text-center">
                  <div className="text-xs font-medium text-text truncate w-full">{p.projectCode}</div>
                  <div className="text-[11px] text-text-dim truncate w-full">{p.customerName}</div>
                </div>
                <Pill status={p.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeading eyebrow="Risk" title="Needs your attention" />
          <div className="space-y-3">
            {lowStock.slice(0, 2).map((s) => (
              <div key={s.id} className="flex items-start gap-2 text-xs">
                <AlertTriangle size={14} className="text-rose mt-0.5 shrink-0" />
                <div>
                  <div className="text-text font-medium">{s.productName}</div>
                  <div className="text-text-dim">{s.availableQuantity} {s.unit} available, minimum {s.minimumLevel}</div>
                </div>
              </div>
            ))}
            {filteredProjects.filter((p) => p.status === 'Delayed' || p.status === 'Issue Raised').slice(0, 2).map((p) => (
              <div key={p.id} className="flex items-start gap-2 text-xs">
                <TrendingUp size={14} className="text-rose mt-0.5 shrink-0" />
                <div>
                  <div className="text-text font-medium">{p.projectCode} — {p.customerName}</div>
                  <div className="text-text-dim">{p.nextAction}</div>
                  <div className="text-text-dim">Due {formatDate(p.dueDate)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
