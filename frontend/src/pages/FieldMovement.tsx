import { useApi } from '../api/hooks'
import type { FieldMovement } from '../types/models'
import { Card, SectionHeading, Pill } from '../components/shared/Primitives'
import { MapPin, Navigation, Clock } from 'lucide-react'

export default function FieldMovement() {
  const { data: fieldMovements } = useApi<FieldMovement[]>('/api/v1/field-movements')
  
  if (!fieldMovements) return <div className="p-8 text-center text-text-dim text-sm">Loading field movements...</div>
  
  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Common Module" title="Field Mobility / Employee Movement" action={<span className="text-xs text-text-dim">Simulated live location — frontend demo only</span>} />

      <div className="grid lg:grid-cols-2 gap-4">
        {fieldMovements.map((f) => (
          <Card key={f.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{f.employeeName}</div>
                <div className="text-xs text-text-dim">{f.role}</div>
              </div>
              <Pill status={f.status} />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-sun shrink-0" />
              <span>{f.currentLocation}</span>
              <span className="relative flex h-2 w-2 ml-auto">
                {(f.status === 'On Field' || f.status === 'Returning') && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-60" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${f.status === 'Checked Out' ? 'bg-text-dim' : 'bg-teal'}`} />
              </span>
            </div>

            {f.destination && (
              <div className="flex items-center gap-2 text-xs text-text-dim">
                <Navigation size={13} className="shrink-0" /> Heading to {f.destination}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-text-dim">
              <Clock size={13} className="shrink-0" /> Started {f.startTime} · Last update {f.lastUpdate}
            </div>

            <div className="pt-2 border-t border-border">
              <div className="text-[10px] uppercase tracking-wide text-text-dim font-medium mb-2">Route History</div>
              <div className="space-y-1.5">
                {f.routeHistory.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-sun shrink-0" />
                    <span className="text-text-dim w-16 shrink-0">{r.time}</span>
                    <span className="truncate">{r.location}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-text-dim">Backend integration point: <code className="text-teal">GET /field-movement/live</code>, <code className="text-teal">GET /field-movement/{'{employeeId}'}/route-history</code>. Real GPS tracking is out of scope for this frontend-only phase.</p>
    </div>
  )
}
