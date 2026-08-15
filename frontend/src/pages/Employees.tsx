import { useMemo, useState } from 'react'
import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import type { Employee, Department, Designation } from '../types/models'
import { Card, SectionHeading, Pill, Avatar } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import { formatDate } from '../lib/utils'
import { Plus, X } from 'lucide-react'

const DEPT_DESIGNATIONS: Record<Department, Designation[]> = {
  CEO: ['CEO'],
  Marketing: ['Telecaller', 'Direct Marketing Executive'],
  'Site Visit': ['Site Visitor'],
  Accounts: ['Accountant', 'Partner / Payment Receiver'],
  Project: ['Project Head', 'Field Technician', 'Document Follow-up Executive'],
  Warehouse: ['Warehouse Maintenance'],
  Transport: ['Driver'],
}

const DEPT_OPTIONS: Department[] = ['CEO', 'Marketing', 'Site Visit', 'Accounts', 'Project', 'Warehouse', 'Transport']
const AVATAR_COLORS = ['#f2a93b', '#2fb8a8', '#e2635f', '#d8842a']

const emptyForm = {
  name: '', mobile: '', email: '', joiningDate: '', department: 'Marketing' as Department,
  designation: 'Telecaller' as Designation, username: '', tempPassword: '',
}

export default function Employees() {
  const { data: employees, mutate: refetchEmployees } = useApi<Employee[]>('/api/v1/employees')
  
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState('')

  const filtered = useMemo(() => {
    if (!employees) return []
    return employees.filter((e) => deptFilter === 'All Departments' || e.department === deptFilter)
  }, [employees, deptFilter])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!employees || !form.name || !form.mobile || !form.email || !form.joiningDate || !form.username) return
    const nextCode = `SSC-${String(employees.length + 1).padStart(3, '0')}`
    
    try {
      await apiClient('/api/v1/employees', {
        method: 'POST',
        body: JSON.stringify({
          employeeCode: nextCode,
          name: form.name,
          mobile: form.mobile,
          email: form.email,
          joiningDate: form.joiningDate,
          department: form.department,
          designation: form.designation,
          username: form.username,
          password: form.tempPassword || 'Success@123',
          employmentStatus: 'Active',
          avatarColor: AVATAR_COLORS[employees.length % AVATAR_COLORS.length],
        })
      })
      await refetchEmployees()
      setForm(emptyForm)
      setShowForm(false)
      setToast(`${form.name} added to ${form.department} as ${form.designation}. Portal access provisioned for ${form.username}.`)
      setTimeout(() => setToast(''), 5000)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (!employees) return <div className="p-8 text-center text-text-dim text-sm">Loading employees...</div>

  const columns: Column<Employee>[] = [
    { header: 'Employee', cell: (e) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={e.name} color={e.avatarColor} />
        <div>
          <div className="font-medium text-text">{e.name}</div>
          <div className="text-xs text-text-dim">{e.employeeCode}</div>
        </div>
      </div>
    ) },
    { header: 'Department', cell: (e) => e.department },
    { header: 'Designation', cell: (e) => <span className="text-text-dim">{e.designation}</span> },
    { header: 'Contact', cell: (e) => (
      <div className="text-xs">
        <div>{e.mobile}</div>
        <div className="text-text-dim">{e.email}</div>
      </div>
    ) },
    { header: 'Joined', cell: (e) => <span className="text-text-dim">{formatDate(e.joiningDate)}</span> },
    { header: 'Status', cell: (e) => <Pill status={e.employmentStatus} /> },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="CEO Only"
        title="Employees"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-sun text-ink font-medium text-xs px-3 py-2 rounded-lg hover:brightness-110 transition"
          >
            <Plus size={14} /> Create Employee
          </button>
        }
      />

      {toast && (
        <div className="bg-teal/10 border border-teal/30 text-teal text-xs rounded-lg px-3 py-2">{toast}</div>
      )}

      <Card className="p-3 flex flex-wrap gap-2">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          <option>All Departments</option>
          {DEPT_OPTIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <span className="text-xs text-text-dim self-center ml-auto">{filtered.length} of {employees?.length || 0} employees</span>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        keyFn={(e) => e.id}
        mobileCard={(e) => (
          <Card className="p-4 flex items-center gap-3">
            <Avatar name={e.name} color={e.avatarColor} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{e.name}</div>
              <div className="text-xs text-text-dim truncate">{e.designation} · {e.department}</div>
            </div>
            <Pill status={e.employmentStatus} />
          </Card>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-sun font-semibold">Only the CEO can create accounts</div>
                <h3 className="text-lg font-display font-semibold">New Employee</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-text-dim hover:text-text"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <Field label="Employee Name" required>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Dinesh Kumar" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mobile Number" required>
                  <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="input" placeholder="98XXXXXXXX" />
                </Field>
                <Field label="Email" required>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="name@successsolar.in" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Joining Date" required>
                  <input required type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="input" />
                </Field>
                <Field label="Employment Status">
                  <input disabled value="Active" className="input opacity-60" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department" required>
                  <select
                    value={form.department}
                    onChange={(e) => {
                      const d = e.target.value as Department
                      setForm({ ...form, department: d, designation: DEPT_DESIGNATIONS[d][0] })
                    }}
                    className="input"
                  >
                    {DEPT_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Designation / Role" required>
                  <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value as Designation })} className="input">
                    {DEPT_DESIGNATIONS[form.department].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Username" required>
                  <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" placeholder="dinesh.kumar" />
                </Field>
                <Field label="Temporary Password">
                  <input value={form.tempPassword} onChange={(e) => setForm({ ...form, tempPassword: e.target.value })} className="input" placeholder="Auto-generated on save" />
                </Field>
              </div>
              <p className="text-[11px] text-text-dim">The selected department and designation determine which portal this employee lands on after first login.</p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-xs font-medium text-text-dim hover:text-text">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium bg-sun text-ink hover:brightness-110">Create Employee</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          background: var(--color-panel-raised);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          padding: 0.5rem 0.65rem;
          font-size: 0.8rem;
          color: var(--color-text);
          outline: none;
        }
      `}</style>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-text-dim font-medium">{label}{required && <span className="text-rose"> *</span>}</span>
      {children}
    </label>
  )
}
