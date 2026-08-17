import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/shared/Layout'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Leads from './pages/Leads'
import Customers from './pages/Customers'
import Quotations from './pages/Quotations'
import Payments from './pages/Payments'
import Stock from './pages/Stock'
import Employees from './pages/Employees'
import Departments from './pages/Departments'
import FieldMovement from './pages/FieldMovement'
import NotificationsPage from './pages/Notifications'
import Leave from './pages/Leave'
import Performance from './pages/Performance'
import Reports from './pages/Reports'
import Activity from './pages/Activity'
import Approvals from './pages/Approvals'
import MarketingDashboard from './pages/marketing/MarketingDashboard'
import LeadInbox from './pages/marketing/LeadInbox'
import CustomerList from './pages/marketing/CustomerList'
import CallHistory from './pages/marketing/CallHistory'
import FollowUps from './pages/marketing/FollowUps'
import FieldVisit from './pages/marketing/FieldVisit'

function Home() {
  const { portal } = useAuth()
  if (!portal) return null
  return portal === 'CEO' ? <Dashboard /> : <MarketingDashboard />
}

function AppRoutes() {
  const { portal } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/leave" element={<Leave />} />

                {portal === 'CEO' && (
                  <>
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/stock" element={<Stock />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/field-movement" element={<FieldMovement />} />
                    <Route path="/performance" element={<Performance />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/activity" element={<Activity />} />
                    <Route path="/approvals" element={<Approvals />} />
                  </>
                )}

                {portal !== 'CEO' && (
                  <>
                    <Route path="/marketing/leads" element={<LeadInbox />} />
                    <Route path="/marketing/customers" element={<CustomerList />} />
                    <Route path="/marketing/calls" element={<CallHistory />} />
                    <Route path="/marketing/follow-ups" element={<FollowUps />} />
                    {portal === 'Direct Marketing' && (
                      <Route path="/marketing/field-visit" element={<FieldVisit />} />
                    )}
                  </>
                )}
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
