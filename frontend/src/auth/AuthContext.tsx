import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Employee } from '../types/models'

export type PortalKey = 'CEO' | 'Telecalling' | 'Direct Marketing'

interface AuthState {
  employee: Employee | null
  portal: PortalKey | null
  ready: boolean
  login: (username: string, password?: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const STORAGE_KEY = 'ssc-erp-employee-v2'
const PORTAL_KEY = 'ssc-erp-portal-v2'
const TOKEN_KEY = 'ssc-erp-token-v2'
const REFRESH_KEY = 'ssc-erp-refresh-v2'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [portal, setPortal] = useState<PortalKey | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const savedEmp = localStorage.getItem(STORAGE_KEY)
    const savedPortal = localStorage.getItem(PORTAL_KEY)
    if (savedEmp) {
      setEmployee(JSON.parse(savedEmp))
      setPortal(savedPortal as PortalKey | null)
    }
    setReady(true)
  }, [])

  const login: AuthState['login'] = async (username, password = '') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return { ok: false, error: data.detail || 'Login failed.' }
      }
      
      if (!data.portal) {
         return { ok: false, error: 'This module only supports CEO and Marketing accounts so far.' }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.employee))
      localStorage.setItem(PORTAL_KEY, data.portal)
      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(REFRESH_KEY, data.refresh_token)
      
      setEmployee(data.employee)
      setPortal(data.portal)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: 'Network error connecting to backend.' }
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PORTAL_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setEmployee(null)
    setPortal(null)
  }

  return (
    <AuthContext.Provider value={{ employee, portal, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
