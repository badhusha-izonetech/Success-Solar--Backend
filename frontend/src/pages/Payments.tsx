import { useMemo, useRef, useState } from 'react'
import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, SectionHeading, Pill, KpiCard, Modal, Field, inputCls } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import type { Payment, Project } from '../types/models'
import { formatINR, formatDate } from '../lib/utils'
import { Upload, Check, X } from 'lucide-react'

const STATE_OPTIONS = ['All States', 'Pending', 'Partial', 'Proof Uploaded', 'Under Verification', 'Verified', 'Rejected']
const PAYMENT_TYPES = ['Advance (50%)', 'Balance Payment', 'Partial Payment', 'Full Payment']
const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cheque', 'Cash', 'Card']

export default function Payments() {
  const { employee } = useAuth()
  const { data: payments, mutate: refetch } = useApi<Payment[]>('/api/v1/payments')
  const { data: projects = [] } = useApi<Project[]>('/api/v1/projects')

  const [state, setState] = useState('All States')
  const [showCreate, setShowCreate] = useState(false)
  const [verifying, setVerifying] = useState<Payment | null>(null)
  const [rejecting, setRejecting] = useState<Payment | null>(null)
  const [uploadingProof, setUploadingProof] = useState<Payment | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Create payment form
  const [createForm, setCreateForm] = useState({
    projectId: '', customerName: '', expectedAmount: '',
    paymentType: 'Advance (50%)' as Payment['paymentType'],
    paymentDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  })

  // Verify form
  const [verifyForm, setVerifyForm] = useState({
    actualAmount: '', paymentMode: 'UPI', transactionReference: '', remarks: '',
  })

  // Reject form
  const [rejectRemarks, setRejectRemarks] = useState('')

  const filtered = useMemo(() => {
    if (!payments) return []
    return payments.filter((p) => state === 'All States' || p.state === state)
  }, [state, payments])

  const totalExpected = payments?.reduce((s, p) => s + p.expectedAmount, 0) || 0
  const totalReceived = payments?.reduce((s, p) => s + p.actualAmount, 0) || 0
  const pendingVerification = payments?.filter((p) => p.state === 'Under Verification' || p.state === 'Proof Uploaded').length || 0

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    const proj = projects.find((p) => p.id === createForm.projectId)
    await apiClient('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        projectId: createForm.projectId,
        customerName: proj?.customerName || createForm.customerName,
        expectedAmount: Number(createForm.expectedAmount),
        paymentType: createForm.paymentType,
        paymentDate: createForm.paymentDate,
        remarks: createForm.remarks || undefined,
      }),
    })
    await refetch()
    setShowCreate(false)
    setCreateForm({ projectId: '', customerName: '', expectedAmount: '', paymentType: 'Advance (50%)', paymentDate: new Date().toISOString().slice(0, 10), remarks: '' })
  }

  async function submitVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!verifying) return
    await apiClient(`/api/v1/payments/${verifying.id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({
        actualAmount: Number(verifyForm.actualAmount),
        paymentMode: verifyForm.paymentMode,
        transactionReference: verifyForm.transactionReference || undefined,
        remarks: verifyForm.remarks || undefined,
      }),
    })
    await refetch()
    setVerifying(null)
    setVerifyForm({ actualAmount: '', paymentMode: 'UPI', transactionReference: '', remarks: '' })
  }

  async function submitReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejecting || !rejectRemarks.trim()) return
    await apiClient(`/api/v1/payments/${rejecting.id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ remarks: rejectRemarks }),
    })
    await refetch()
    setRejecting(null)
    setRejectRemarks('')
  }

  function handleProofFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingProof) return
    const fd = new FormData()
    fd.append('file', file)
    apiClient(`/api/v1/payments/${uploadingProof.id}/proof`, { method: 'POST', body: fd })
      .then(() => { refetch(); setUploadingProof(null) })
    e.target.value = ''
  }

  if (!payments) return <div className="p-8 text-center text-text-dim text-sm">Loading payments...</div>

  const canVerify = employee?.designation === 'Accountant' || employee?.designation === 'CEO'

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
    { header: '', cell: (p) => (
      <div className="flex items-center gap-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {(p.state === 'Pending' || p.state === 'Partial') && (
          <button onClick={() => { setUploadingProof(p); fileRef.current?.click() }} className="text-xs text-sun hover:underline flex items-center gap-1">
            <Upload size={11} /> Proof
          </button>
        )}
        {canVerify && (p.state === 'Proof Uploaded' || p.state === 'Under Verification') && (
          <>
            <button onClick={() => { setVerifying(p); setVerifyForm({ actualAmount: String(p.expectedAmount), paymentMode: 'UPI', transactionReference: '', remarks: '' }) }} className="text-xs text-teal hover:underline flex items-center gap-1">
              <Check size={11} /> Verify
            </button>
            <button onClick={() => setRejecting(p)} className="text-xs text-rose hover:underline flex items-center gap-1">
              <X size={11} /> Reject
            </button>
          </>
        )}
      </div>
    ) },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Accounts"
        title="Payments"
        action={
          <button onClick={() => setShowCreate(true)} className="bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors">
            + New Payment
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Total Expected" value={formatINR(totalExpected)} accent="sun" />
        <KpiCard label="Total Received" value={formatINR(totalReceived)} accent="teal" />
        <KpiCard label="Awaiting Verification" value={String(pendingVerification)} accent="rose" />
      </div>

      <Card className="p-3 flex flex-wrap gap-2">
        <select value={state} onChange={(e) => setState(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          {STATE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-text-dim self-center ml-auto">{filtered.length} of {payments.length}</span>
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
            <div className="flex gap-3 pt-1">
              {(p.state === 'Pending' || p.state === 'Partial') && (
                <button onClick={() => { setUploadingProof(p); fileRef.current?.click() }} className="text-xs text-sun hover:underline">Upload Proof</button>
              )}
              {canVerify && (p.state === 'Proof Uploaded' || p.state === 'Under Verification') && (
                <>
                  <button onClick={() => { setVerifying(p); setVerifyForm({ actualAmount: String(p.expectedAmount), paymentMode: 'UPI', transactionReference: '', remarks: '' }) }} className="text-xs text-teal hover:underline">Verify</button>
                  <button onClick={() => setRejecting(p)} className="text-xs text-rose hover:underline">Reject</button>
                </>
              )}
            </div>
          </Card>
        )}
      />

      {/* Hidden file input for proof upload */}
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleProofFile} />

      {/* Create Payment Modal */}
      {showCreate && (
        <Modal title="New Payment Record" onClose={() => setShowCreate(false)}>
          <form onSubmit={submitCreate} className="space-y-4">
            <Field label="Project">
              <select required className={inputCls} value={createForm.projectId} onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}>
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.projectCode} — {p.customerName}</option>)}
              </select>
            </Field>
            <Field label="Payment Type">
              <select className={inputCls} value={createForm.paymentType} onChange={(e) => setCreateForm({ ...createForm, paymentType: e.target.value as Payment['paymentType'] })}>
                {PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Expected Amount (₹)">
              <input required type="number" min={0} className={inputCls} value={createForm.expectedAmount} onChange={(e) => setCreateForm({ ...createForm, expectedAmount: e.target.value })} placeholder="e.g. 150000" />
            </Field>
            <Field label="Payment Date">
              <input type="date" className={inputCls} value={createForm.paymentDate} onChange={(e) => setCreateForm({ ...createForm, paymentDate: e.target.value })} />
            </Field>
            <Field label="Remarks">
              <textarea className={inputCls} rows={2} value={createForm.remarks} onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })} placeholder="Optional" />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Verify Modal */}
      {verifying && (
        <Modal title={`Verify Payment — ${verifying.customerName}`} onClose={() => setVerifying(null)}>
          <form onSubmit={submitVerify} className="space-y-4">
            <Field label="Actual Amount Received (₹)">
              <input required type="number" min={0} className={inputCls} value={verifyForm.actualAmount} onChange={(e) => setVerifyForm({ ...verifyForm, actualAmount: e.target.value })} />
            </Field>
            <Field label="Payment Mode">
              <select className={inputCls} value={verifyForm.paymentMode} onChange={(e) => setVerifyForm({ ...verifyForm, paymentMode: e.target.value })}>
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Transaction Reference">
              <input className={inputCls} value={verifyForm.transactionReference} onChange={(e) => setVerifyForm({ ...verifyForm, transactionReference: e.target.value })} placeholder="UTR / Cheque no. / Reference" />
            </Field>
            <Field label="Remarks">
              <textarea className={inputCls} rows={2} value={verifyForm.remarks} onChange={(e) => setVerifyForm({ ...verifyForm, remarks: e.target.value })} placeholder="Optional" />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setVerifying(null)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-teal text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Verify Payment</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejecting && (
        <Modal title={`Reject Payment — ${rejecting.customerName}`} onClose={() => setRejecting(null)}>
          <form onSubmit={submitReject} className="space-y-4">
            <Field label="Rejection Reason">
              <textarea required className={inputCls} rows={3} value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} placeholder="Explain why this payment is being rejected" />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setRejecting(null)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-rose text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Reject Payment</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
