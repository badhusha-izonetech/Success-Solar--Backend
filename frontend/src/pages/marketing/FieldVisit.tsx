import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useApi } from '../../api/hooks'
import { apiClient } from '../../api/client'
import type { Lead, FieldMovement } from '../../types/models'
import { Card, SectionHeading, Pill, Field, inputCls, Modal } from '../../components/shared/Primitives'
import { MapPin, Camera, Share2, Play, Square } from 'lucide-react'

// Mock nearby locations used to simulate live movement for a Direct Marketing
// field visit, in the absence of a real GPS backend.
const MOCK_WAYPOINTS = [
  'Head Office, Thillai Nagar',
  'Chathiram Bus Stand',
  'Cantonment Junction',
  'Near customer site, entering premises',
  'Customer site — visit in progress',
]

export default function FieldVisit() {
  const { employee } = useAuth()
  
  const { data: leads = [] } = useApi<Lead[]>('/api/v1/leads')
  const { data: fieldMovements = [], mutate: refetchMovements } = useApi<FieldMovement[]>('/api/v1/field-movements/mine')
  
  const [showStart, setShowStart] = useState(false)
  const [leadId, setLeadId] = useState('')
  const [destination, setDestination] = useState('')
  const [waypointIdx, setWaypointIdx] = useState(0)
  const [noteDraft, setNoteDraft] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const myVisits = useMemo(
    () => fieldMovements.filter((fm) => fm.employeeId === employee?.id),
    [fieldMovements, employee],
  )
  const activeVisit = myVisits.find((v) => v.status === 'On Field' || v.status === 'Checked In')
  const myLeads = useMemo(() => leads.filter((l) => l.assignedEmployeeId === employee?.id && l.status !== 'Lost' && l.status !== 'Converted'), [leads, employee])

  async function submitStart(e: React.FormEvent) {
    e.preventDefault()
    if (!employee) return
    const lead = myLeads.find((l) => l.id === leadId)
    
    await apiClient('/api/v1/field-movements/start', {
      method: 'POST',
      body: JSON.stringify({
        destination: destination || (lead ? `${lead.address}, ${lead.area}` : ''),
        leadId: lead?.id || null,
        currentLocation: 'Head Office, Thillai Nagar'
      })
    })
    
    await refetchMovements()
    setWaypointIdx(0)
    setShowStart(false)
    setLeadId('')
    setDestination('')
  }

  async function pushLocationUpdate() {
    if (!activeVisit) return
    const nextIdx = Math.min(waypointIdx + 1, MOCK_WAYPOINTS.length - 1)
    setWaypointIdx(nextIdx)
    await apiClient(`/api/v1/field-movements/${activeVisit.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ currentLocation: MOCK_WAYPOINTS[nextIdx] })
    })
    await refetchMovements()
  }

  async function shareLocation() {
    if (!activeVisit) return
    await apiClient(`/api/v1/field-movements/${activeVisit.id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text: `Location shared with CEO — ${activeVisit.currentLocation}` })
    })
    alert('Live location shared with CEO / Field Movement dashboard.')
    await refetchMovements()
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeVisit) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    apiClient(`/api/v1/field-movements/${activeVisit.id}/photo`, {
      method: 'POST',
      body: formData
    }).then(() => refetchMovements())
    
    e.target.value = ''
  }

  async function addNote() {
    if (!activeVisit || !noteDraft.trim()) return
    await apiClient(`/api/v1/field-movements/${activeVisit.id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text: noteDraft.trim() })
    })
    await refetchMovements()
    setNoteDraft('')
  }

  async function endVisit() {
    if (!activeVisit) return
    await apiClient(`/api/v1/field-movements/${activeVisit.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Checked Out', currentLocation: 'Head Office, Thillai Nagar' })
    })
    await refetchMovements()
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Direct / Field Marketing"
        title="Field Visit Tracking"
        action={!activeVisit && (
          <button onClick={() => setShowStart(true)} className="bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors flex items-center gap-1.5">
            <Play size={13} /> Start Visit
          </button>
        )}
      />
      <p className="text-xs text-text-dim -mt-3">
        Live location, photo capture, and location sharing for direct marketing field visits — the same field-visit capability used by the 1st Site Visit team.
      </p>

      {activeVisit ? (
        <Card className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-text-dim">Visit ID</div>
              <div className="font-mono text-sm text-teal">{activeVisit.id}</div>
            </div>
            <Pill status={activeVisit.status} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-text-dim">Current Location</div><div className="font-medium flex items-center gap-1.5"><MapPin size={14} className="text-sun" />{activeVisit.currentLocation}</div></div>
            <div><div className="text-xs text-text-dim">Destination</div><div className="font-medium">{activeVisit.destination || '—'}</div></div>
            <div><div className="text-xs text-text-dim">Started</div><div className="font-medium">{activeVisit.startTime}</div></div>
            <div><div className="text-xs text-text-dim">Last Update</div><div className="font-medium">{activeVisit.lastUpdate}</div></div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={pushLocationUpdate} disabled={waypointIdx >= MOCK_WAYPOINTS.length - 1} className="text-xs font-medium px-3 py-2 rounded-lg bg-sun/10 text-sun border border-sun/30 hover:bg-sun/20 transition-colors disabled:opacity-40 flex items-center gap-1.5">
              <MapPin size={13} /> Update Live Location
            </button>
            <button onClick={shareLocation} className="text-xs font-medium px-3 py-2 rounded-lg bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20 transition-colors flex items-center gap-1.5">
              <Share2 size={13} /> Share Location with CEO
            </button>
            <button onClick={() => fileRef.current?.click()} className="text-xs font-medium px-3 py-2 rounded-lg bg-panel-raised border border-border hover:bg-black/[0.03] transition-colors flex items-center gap-1.5">
              <Camera size={13} /> Upload Site Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <button onClick={endVisit} className="text-xs font-medium px-3 py-2 rounded-lg bg-rose/10 text-rose border border-rose/30 hover:bg-rose/20 transition-colors flex items-center gap-1.5 ml-auto">
              <Square size={13} /> Check Out
            </button>
          </div>

          <div className="flex gap-2">
            <input className={inputCls} placeholder="Add a visit note…" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
            <button onClick={addNote} className="text-xs font-medium px-3 py-2 rounded-lg bg-panel-raised border border-border hover:bg-black/[0.03] transition-colors whitespace-nowrap">Add Note</button>
          </div>

          {(activeVisit.photos?.length ?? 0) > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium mb-2">Site Photos</div>
              <div className="flex gap-2 flex-wrap">
                {activeVisit.photos!.map((p: any, i: number) => (
                  <img key={i} src={p.url || p} alt={`Site photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-border" />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium mb-2">Route / Activity Log</div>
            <div className="space-y-1.5 text-xs">
              {activeVisit.routeHistory.map((r: any, i: number) => (
                <div key={i} className="flex gap-3 text-text-dim"><span className="text-text font-medium w-16 shrink-0">{r.time}</span>{r.location}</div>
              ))}
              {activeVisit.visitNotes?.map((n: any, i: number) => (
                <div key={`n${i}`} className="flex gap-3 text-text-dim italic"><span className="w-16 shrink-0" />{n.text || n}</div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center text-sm text-text-dim">No active field visit. Start one above when you head out to meet a lead.</Card>
      )}

      <Card className="p-4">
        <SectionHeading eyebrow="History" title="My Field Visits" />
        <div className="space-y-2">
          {myVisits.filter((v) => v.id !== activeVisit?.id).map((v) => (
            <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-t border-border pt-2 first:border-t-0 first:pt-0">
              <span className="font-mono text-xs text-teal w-16 shrink-0">{v.id}</span>
              <Pill status={v.status} />
              <span className="text-text-dim text-xs">{v.destination || v.currentLocation} · started {v.startTime}</span>
            </div>
          ))}
          {myVisits.length <= (activeVisit ? 1 : 0) && <div className="text-xs text-text-dim">No past visits yet.</div>}
        </div>
      </Card>

      {showStart && (
        <Modal title="Start Field Visit" onClose={() => setShowStart(false)}>
          <form onSubmit={submitStart} className="space-y-4">
            <Field label="Lead / Customer">
              <select className={inputCls} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                <option value="">— Select a lead —</option>
                {myLeads.map((l) => <option key={l.id} value={l.id}>{l.customerName} — {l.area}</option>)}
              </select>
            </Field>
            <Field label="Destination"><input className={inputCls} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Auto-filled from lead, or type manually" /></Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowStart(false)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Start Visit</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
