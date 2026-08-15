import { useApi } from '../api/hooks'
import { Card, SectionHeading, Avatar } from '../components/shared/Primitives'
import type { Employee } from '../types/models'

type DepartmentWithStaff = {
  id: string
  name: string
  teams: string[]
  staffCount: number
  staff: Employee[]
}

export default function Departments() {
  const { data: departmentList } = useApi<DepartmentWithStaff[]>('/api/v1/departments')
  
  if (!departmentList) return <div className="p-8 text-center text-text-dim text-sm">Loading departments...</div>
  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Structure" title="Departments" />
      <div className="grid md:grid-cols-2 gap-4">
        {departmentList.map((d) => {
          const staff = d.staff || []
          return (
            <Card key={d.name} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">{d.name}</h3>
                <span className="text-[11px] text-text-dim">{d.staffCount || staff.length} staff</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {d.teams.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.035] border border-border text-text-dim">{t}</span>
                ))}
              </div>
              <div className="space-y-2">
                {staff.map((e) => (
                  <div key={e.id} className="flex items-center gap-2.5">
                    <Avatar name={e.name} color={e.avatarColor} />
                    <div className="min-w-0">
                      <div className="text-sm truncate">{e.name}</div>
                      <div className="text-[11px] text-text-dim truncate">{e.designation}</div>
                    </div>
                  </div>
                ))}
                {staff.length === 0 && <div className="text-xs text-text-dim">No employees assigned yet.</div>}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
