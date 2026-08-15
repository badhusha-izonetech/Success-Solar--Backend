export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(iso: string): string {
  if (!iso || iso === '—') return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export const STAGE_ORDER = [
  'Site Visit',
  'Quotation',
  'Advance Payment',
  'Project Execution',
  'Installation',
  'Final Connection',
  'Completed',
] as const

export function stageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number])
}

export const STATUS_COLORS: Record<string, string> = {
  'On Track': 'text-teal bg-teal/10 border-teal/30',
  Delayed: 'text-rose bg-rose/10 border-rose/30',
  'On Hold': 'text-text-dim bg-black/[0.035] border-border',
  Completed: 'text-sun bg-sun/10 border-sun/30',
  'Issue Raised': 'text-rose bg-rose/10 border-rose/30',
  New: 'text-text-dim bg-black/[0.035] border-border',
  Contacted: 'text-teal bg-teal/10 border-teal/30',
  Interested: 'text-teal bg-teal/10 border-teal/30',
  'Follow-up': 'text-sun bg-sun/10 border-sun/30',
  'Site Visit Required': 'text-sun bg-sun/10 border-sun/30',
  'Site Visit Scheduled': 'text-sun bg-sun/10 border-sun/30',
  'Quotation Stage': 'text-teal bg-teal/10 border-teal/30',
  Lost: 'text-rose bg-rose/10 border-rose/30',
  Converted: 'text-teal bg-teal/10 border-teal/30',
  Draft: 'text-text-dim bg-black/[0.035] border-border',
  Submitted: 'text-sun bg-sun/10 border-sun/30',
  Sent: 'text-sun bg-sun/10 border-sun/30',
  'Customer Review': 'text-sun bg-sun/10 border-sun/30',
  'Revision Required': 'text-rose bg-rose/10 border-rose/30',
  'Customer Approved': 'text-teal bg-teal/10 border-teal/30',
  'Customer Rejected': 'text-rose bg-rose/10 border-rose/30',
  'Awaiting Advance': 'text-sun bg-sun/10 border-sun/30',
  Expired: 'text-rose bg-rose/10 border-rose/30',
  Pending: 'text-sun bg-sun/10 border-sun/30',
  Partial: 'text-sun bg-sun/10 border-sun/30',
  'Proof Uploaded': 'text-teal bg-teal/10 border-teal/30',
  'Under Verification': 'text-sun bg-sun/10 border-sun/30',
  Verified: 'text-teal bg-teal/10 border-teal/30',
  Rejected: 'text-rose bg-rose/10 border-rose/30',
  Active: 'text-teal bg-teal/10 border-teal/30',
  'On Leave': 'text-sun bg-sun/10 border-sun/30',
  Suspended: 'text-rose bg-rose/10 border-rose/30',
  Relieved: 'text-text-dim bg-black/[0.035] border-border',
  Approved: 'text-teal bg-teal/10 border-teal/30',
}

export function statusClass(status: string): string {
  return STATUS_COLORS[status] ?? 'text-text-dim bg-black/[0.035] border-border'
}
