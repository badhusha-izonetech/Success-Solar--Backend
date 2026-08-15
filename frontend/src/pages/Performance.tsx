import { useApi } from '../api/hooks'
import { Card, SectionHeading } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import type { PerformanceRecord } from '../types/models'
import { Trophy } from 'lucide-react'

export default function Performance() {
  const { data: performanceRecords } = useApi<PerformanceRecord[]>('/api/v1/performance')
  
  const sorted = [...(performanceRecords || [])].sort((a, b) => b.score - a.score)

  if (!performanceRecords) return <div className="p-8 text-center text-text-dim text-sm">Loading performance...</div>

  const columns: Column<PerformanceRecord>[] = [
    { header: 'Rank', cell: (p) => (
      <span className="flex items-center gap-1 font-medium">
        {p.rank === 1 && <Trophy size={13} className="text-sun" />}
        #{p.rank}
      </span>
    ) },
    { header: 'Employee', cell: (p) => (
      <div>
        <div className="font-medium">{p.employeeName}</div>
        <div className="text-xs text-text-dim">{p.role}</div>
      </div>
    ) },
    { header: 'Department', cell: (p) => p.department },
    { header: 'Period', cell: (p) => <span className="text-text-dim">{p.period}</span> },
    { header: 'Score', cell: (p) => (
      <div className="flex items-center gap-2 w-28">
        <div className="flex-1 h-1.5 bg-black/[0.035] rounded-full overflow-hidden">
          <div className="h-full bg-sun rounded-full" style={{ width: `${p.score}%` }} />
        </div>
        <span className="text-xs w-8">{p.score}</span>
      </div>
    ) },
    { header: 'Completed', cell: (p) => p.completedWork },
    { header: 'Pending', cell: (p) => <span className="text-text-dim">{p.pendingWork}</span> },
    { header: 'Efficiency', cell: (p) => `${p.efficiency}%` },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Common Module" title="Performance" action={<span className="text-xs text-text-dim">Ranking formula finalization pending — mock data shown</span>} />
      <Card className="p-2">
        <DataTable
          columns={columns}
          rows={sorted}
          keyFn={(p) => p.id}
          mobileCard={(p) => (
            <Card className="p-4 space-y-1">
              <div className="flex justify-between">
                <div className="font-medium">{p.employeeName}</div>
                <span className="text-xs text-sun">Score {p.score}</span>
              </div>
              <div className="text-xs text-text-dim">{p.role} · {p.department} · {p.period}</div>
            </Card>
          )}
        />
      </Card>
    </div>
  )
}
