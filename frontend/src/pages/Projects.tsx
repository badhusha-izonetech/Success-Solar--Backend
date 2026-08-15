import { useMemo, useState } from 'react'
import { useApi } from '../api/hooks'
import type { Project, Employee } from '../types/models'
import { Card, SectionHeading, Pill, PriorityDot } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import { StageArc } from '../components/shared/StageArc'
import { formatINR, formatDate } from '../lib/utils'
import { X, MapPin, Phone } from 'lucide-react'

const STATUS_OPTIONS = ['All Status', 'On Track', 'Delayed', 'On Hold', 'Completed', 'Issue Raised']

export default function Projects() {
  const [status, setStatus] = useState('All Status')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Project | null>(null)
  
  const { data: projects } = useApi<Project[]>('/api/v1/projects')
  const { data: employees } = useApi<Employee[]>('/api/v1/employees')

  const filtered = useMemo(() => {
    if (!projects) return []
    return projects.filter(
      (p) =>
        (status === 'All Status' || p.status === status) &&
        (p.customerName.toLowerCase().includes(query.toLowerCase()) ||
          p.projectCode.toLowerCase().includes(query.toLowerCase()) ||
          p.area.toLowerCase().includes(query.toLowerCase())),
    )
  }, [projects, status, query])
  
  if (!projects || !employees) return <div className="p-8 text-center text-text-dim text-sm">Loading projects...</div>

  const columns: Column<Project>[] = [
    { header: 'Project', cell: (p) => (
      <div>
        <div className="font-medium text-text">{p.projectCode}</div>
        <div className="text-text-dim text-xs">{p.customerName}</div>
      </div>
    ) },
    { header: 'Site', cell: (p) => <span className="text-text-dim">{p.site}</span> },
    { header: 'Capacity', cell: (p) => `${p.capacityKw} kW` },
    { header: 'Value', cell: (p) => formatINR(p.projectValue) },
    { header: 'Balance', cell: (p) => <span className={p.balanceAmount > 0 ? 'text-sun' : 'text-teal'}>{formatINR(p.balanceAmount)}</span> },
    { header: 'Stage', cell: (p) => <StageArc stage={p.currentStage} size="sm" /> },
    { header: 'Priority', cell: (p) => <PriorityDot priority={p.priority} /> },
    { header: 'Status', cell: (p) => <Pill status={p.status} /> },
    { header: 'Due', cell: (p) => <span className="text-text-dim">{formatDate(p.dueDate)}</span> },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Project"
        title="All Projects"
        action={<span className="text-xs text-text-dim">{filtered.length} of {projects.length} projects</span>}
      />

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by customer, project code, or area…"
          className="bg-panel-raised border border-border rounded-lg px-3 py-1.5 text-xs outline-none flex-1 min-w-[200px] placeholder:text-text-dim"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        keyFn={(p) => p.id}
        onRowClick={setSelected}
        mobileCard={(p) => (
          <Card className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{p.projectCode}</div>
                <div className="text-xs text-text-dim">{p.customerName} · {p.area}</div>
              </div>
              <Pill status={p.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-text-dim">
              <span>{formatINR(p.projectValue)}</span>
              <span>Due {formatDate(p.dueDate)}</span>
            </div>
            <StageArc stage={p.currentStage} size="sm" />
          </Card>
        )}
      />

      {selected && <ProjectDrawer project={selected} employees={employees} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ProjectDrawer({ project, employees, onClose }: { project: Project; employees: Employee[]; onClose: () => void }) {
  const tech = employees.find((e) => e.id === project.assignedTechnicianId)
  const doc = employees.find((e) => e.id === project.assignedDocEmployeeId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-panel border-l border-border h-full overflow-y-auto p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-sun font-semibold">{project.projectCode}</div>
            <h3 className="text-xl font-display font-semibold">{project.customerName}</h3>
            <div className="text-xs text-text-dim flex items-center gap-1 mt-1"><MapPin size={12} /> {project.site}</div>
            <div className="text-xs text-text-dim flex items-center gap-1 mt-0.5"><Phone size={12} /> {project.customerMobile}</div>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text"><X size={20} /></button>
        </div>

        <div className="flex justify-center py-3 bg-panel-raised rounded-xl border border-border">
          <StageArc stage={project.currentStage} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Project Value" value={formatINR(project.projectValue)} />
          <Info label="Advance Received" value={formatINR(project.advanceReceived)} />
          <Info label="Balance Due" value={formatINR(project.balanceAmount)} />
          <Info label="Capacity" value={`${project.capacityKw} kW`} />
          <Info label="Warehouse" value={project.warehouseStatus} />
          <Info label="EB Status" value={project.ebStatus} />
          <Info label="Installation" value={project.installationStatus} />
          <Info label="Due Date" value={formatDate(project.dueDate)} />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium">Assigned Team</div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><span className="text-text-dim">Field Technician</span><span>{tech?.name ?? 'Not assigned'}</span></div>
            <div className="flex justify-between"><span className="text-text-dim">Document Follow-up</span><span>{doc?.name ?? 'Not assigned'}</span></div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium">Next Action</div>
          <div className="text-sm bg-panel-raised border border-border rounded-lg p-3">{project.nextAction}</div>
        </div>

        <div className="pt-2 border-t border-border text-[11px] text-text-dim">
          Backend integration point: <code className="text-teal">GET /projects/{'{id}'}</code>, <code className="text-teal">PATCH /projects/{'{id}'}/stage</code>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel-raised border border-border rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-text-dim mb-0.5">{label}</div>
      <div className="font-medium text-text">{value}</div>
    </div>
  )
}
