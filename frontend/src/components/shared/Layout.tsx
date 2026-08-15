import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, UserPlus2, FileText, Wallet,
  Boxes, Users, Building2, MapPinned, Bell, CalendarClock,
  BarChart3, History, CheckCircle2, Menu, X, Search, Sun,
  PhoneCall, Contact, ClipboardList, LogOut, Navigation,
} from 'lucide-react'
import { Avatar } from './Primitives'
import { useAuth } from '../../auth/AuthContext'
import { useApi } from '../../api/hooks'

const ceoNav = [
  { to: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'All Projects', icon: FolderKanban },
  { to: '/leads', label: 'Leads', icon: UserPlus2 },
  { to: '/customers', label: 'Existing Customers', icon: Users },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/stock', label: 'Stock', icon: Boxes },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/field-movement', label: 'Field Movement', icon: MapPinned },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/leave', label: 'Leave', icon: CalendarClock },
  { to: '/performance', label: 'Performance', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/activity', label: 'Activity History', icon: History },
  { to: '/approvals', label: 'Approvals', icon: CheckCircle2 },
]

const marketingNavBase = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/marketing/leads', label: 'Lead Inbox', icon: UserPlus2 },
  { to: '/marketing/customers', label: 'Existing Customers', icon: Contact },
  { to: '/marketing/calls', label: 'Call History', icon: PhoneCall },
  { to: '/marketing/follow-ups', label: 'Follow-up', icon: ClipboardList },
]

const directMarketingFieldNav = { to: '/marketing/field-visit', label: 'Field Visit', icon: Navigation }

const marketingNavTail = [
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/leave', label: 'Leave', icon: CalendarClock },
]

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { employee, portal, logout } = useAuth()
  const navigate = useNavigate()
  
  const { data: notifications = [] } = useApi<any[]>('/api/v1/notifications')
  const unread = notifications.filter((n) => !n.read).length

  const nav =
    portal === 'CEO'
      ? ceoNav
      : portal === 'Direct Marketing'
        ? [...marketingNavBase, directMarketingFieldNav, ...marketingNavTail]
        : [...marketingNavBase, ...marketingNavTail]
  const portalLabel = portal === 'CEO' ? 'CEO Portal · Trichy' : `Marketing Portal · ${portal}`

  if (!employee) return null

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-ink">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-panel border-r border-border flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sun/15 flex items-center justify-center">
            <Sun size={18} className="text-sun" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm leading-tight">Success Solar ERP</div>
            <div className="text-[10px] text-text-dim leading-tight">{portalLabel}</div>
          </div>
          <button className="ml-auto lg:hidden text-text-dim" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-sun/10 text-sun'
                    : 'text-text-dim hover:text-text hover:bg-black/[0.035]'
                }`
              }
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar name={employee.name} color={employee.avatarColor} />
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text truncate">{employee.name}</div>
              <div className="text-[11px] text-text-dim truncate">{employee.designation}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-text-dim hover:text-rose hover:bg-rose/10 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-panel/60 backdrop-blur flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-20">
          <button className="lg:hidden text-text-dim" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-panel-raised border border-border rounded-lg px-3 py-1.5 w-full max-w-sm">
            <Search size={15} className="text-text-dim shrink-0" />
            <input
              placeholder="Search projects, customers, employees…"
              className="bg-transparent outline-none text-[13px] w-full placeholder:text-text-dim"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NavLink to="/notifications" className="relative text-text-dim hover:text-text transition-colors">
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </NavLink>
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-[12px] font-medium text-text">{employee.name}</div>
              <div className="text-[10px] text-text-dim">{employee.employeeCode}</div>
            </div>
            <Avatar name={employee.name} color={employee.avatarColor} />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
