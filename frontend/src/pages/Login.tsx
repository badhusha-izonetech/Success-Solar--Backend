import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { inputCls } from '../components/shared/Primitives'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Enter username and password.')
      return
    }
    const result = await login(username, password)
    if (!result.ok) {
      setError(result.error ?? 'Login failed.')
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-sun/15 flex items-center justify-center mb-3">
            <Sun size={24} className="text-sun" />
          </div>
          <div className="font-display font-semibold text-lg text-text">Success Solar ERP</div>
          <div className="text-xs text-text-dim mt-1">Success Solar Care · Trichy</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-panel border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-text-dim font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rajesh.ceo"
              className={`${inputCls} mt-1.5`}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-text-dim font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputCls} mt-1.5`}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="text-xs text-rose bg-rose/10 border border-rose/30 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" className="w-full bg-sun text-ink font-semibold text-sm rounded-lg py-2.5 hover:bg-sun-deep transition-colors">
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
