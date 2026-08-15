import type { ReactNode } from 'react'
import { statusClass, initials } from '../../lib/utils'

export function Pill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${statusClass(status)}`}>
      {status}
    </span>
  )
}

export function PriorityDot({ priority }: { priority: string }) {
  const color = priority === 'High' ? 'bg-rose' : priority === 'Medium' ? 'bg-sun' : 'bg-text-dim'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {priority}
    </span>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`bg-panel border border-border rounded-xl ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-wider text-sun font-semibold mb-1">{eyebrow}</div>}
        <h2 className="text-lg font-display font-semibold text-text">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {initials(name)}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  sub,
  accent = 'sun',
}: {
  label: string
  value: string
  sub?: string
  accent?: 'sun' | 'teal' | 'rose'
}) {
  const accentColor = accent === 'sun' ? 'var(--color-sun)' : accent === 'teal' ? 'var(--color-teal)' : 'var(--color-rose)'
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: accentColor }} />
      <div className="text-[11px] uppercase tracking-wide text-text-dim font-medium mb-2">{label}</div>
      <div className="text-2xl font-display font-semibold text-text">{value}</div>
      {sub && <div className="text-xs text-text-dim mt-1">{sub}</div>}
    </Card>
  )
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        className={`bg-panel border border-border rounded-t-2xl sm:rounded-2xl w-full ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-panel">
          <h3 className="font-display font-semibold text-text text-sm">{title}</h3>
          <button onClick={onClose} className="text-text-dim hover:text-text text-lg leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-wide text-text-dim font-medium">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full bg-panel-raised border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-sun/60 placeholder:text-text-dim'

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-black/[0.035] border border-border flex items-center justify-center mb-3">
        <span className="w-2 h-2 rounded-full bg-sun" />
      </div>
      <div className="font-display font-semibold text-text mb-1">{title}</div>
      <div className="text-sm text-text-dim max-w-sm">{message}</div>
    </div>
  )
}
