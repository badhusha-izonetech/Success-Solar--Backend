import { useMemo, useState } from 'react'
import { useApi } from '../api/hooks'
import { Card, SectionHeading, KpiCard } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import type { StockItem } from '../types/models'
import { formatINR } from '../lib/utils'
import { AlertTriangle } from 'lucide-react'

const CATEGORY_OPTIONS = ['All Categories', 'Solar Panels', 'Inverters', 'Batteries', 'Mounting Structures', 'Cables & Wiring', 'Electrical Components']

export default function Stock() {
  const { data: stockItems } = useApi<StockItem[]>('/api/v1/stock')
  
  const [category, setCategory] = useState('All Categories')
  const filtered = useMemo(() => {
    if (!stockItems) return []
    return stockItems.filter((s) => category === 'All Categories' || s.category === category)
  }, [category, stockItems])

  const totalValue = stockItems?.reduce((s, i) => s + i.currentQuantity * i.costPerUnit, 0) || 0
  const lowStockCount = stockItems?.filter((s) => s.availableQuantity <= s.minimumLevel).length || 0

  if (!stockItems) return <div className="p-8 text-center text-text-dim text-sm">Loading stock...</div>

  const columns: Column<StockItem>[] = [
    { header: 'Product', cell: (s) => (
      <div>
        <div className="font-medium text-text">{s.productName}</div>
        <div className="text-xs text-text-dim">{s.brand} · {s.model}</div>
      </div>
    ) },
    { header: 'Category', cell: (s) => s.category },
    { header: 'Current', cell: (s) => `${s.currentQuantity} ${s.unit}` },
    { header: 'Reserved', cell: (s) => <span className="text-sun">{s.reservedQuantity} {s.unit}</span> },
    { header: 'Available', cell: (s) => (
      <span className={s.availableQuantity <= s.minimumLevel ? 'text-rose font-medium' : 'text-teal'}>
        {s.availableQuantity} {s.unit}
      </span>
    ) },
    { header: 'Min. Level', cell: (s) => <span className="text-text-dim">{s.minimumLevel} {s.unit}</span> },
    { header: 'Value', cell: (s) => formatINR(s.currentQuantity * s.costPerUnit) },
    { header: '', cell: (s) => s.availableQuantity <= s.minimumLevel && <AlertTriangle size={14} className="text-rose" /> },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Warehouse" title="Stock" action={<span className="text-xs text-text-dim">{filtered.length} of {stockItems?.length || 0} items</span>} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Total Inventory Value" value={formatINR(totalValue)} accent="sun" />
        <KpiCard label="Items Below Minimum" value={String(lowStockCount)} accent="rose" />
        <KpiCard label="Categories Tracked" value={String(CATEGORY_OPTIONS.length - 1)} accent="teal" />
      </div>

      <Card className="p-3 flex flex-wrap gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-panel-raised border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none">
          {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        keyFn={(s) => s.id}
        mobileCard={(s) => (
          <Card className="p-4 space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{s.productName}</div>
                <div className="text-xs text-text-dim">{s.brand} · {s.model}</div>
              </div>
              {s.availableQuantity <= s.minimumLevel && <AlertTriangle size={14} className="text-rose shrink-0" />}
            </div>
            <div className="flex gap-4 text-xs text-text-dim">
              <span>Available: <span className={s.availableQuantity <= s.minimumLevel ? 'text-rose' : 'text-teal'}>{s.availableQuantity} {s.unit}</span></span>
              <span>Reserved: {s.reservedQuantity} {s.unit}</span>
            </div>
          </Card>
        )}
      />
    </div>
  )
}
