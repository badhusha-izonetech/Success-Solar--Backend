import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { employee, ready } = useAuth()
  if (!ready) return null
  if (!employee) return <Navigate to="/login" replace />
  return <>{children}</>
}
