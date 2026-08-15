import { useMemo, useState } from 'react'
import { useApi } from '../api/hooks'
import { apiClient } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, SectionHeading, KpiCard, Modal, Field, inputCls } from '../components/shared/Primitives'
import { DataTable, type Column } from '../components/shared/DataTable'
import type { StockItem } from '../types/models'
import { formatINR } from '../lib/utils'
import { AlertTriangle, Plus, PackagePlus } from 'lucide-react'

const CATEGORY_OPTIONS = ['All Categories', 'Solar Panels', 'Inverters', 'Batteries', 'Mounting Structures', 'Cables & Wiring', 'Electrical Components']
const CATEGORIES = ['Solar Panels', 'Inverters', 'Batteries', 'Mounting Structures', 'Cables & Wiring', 'Electrical Components']

const emptyItemForm = {
  productName: '', category: 'Solar Panels', brand: '', model: '',
  unit: 'Nos', currentQuantity: '0', minimumLevel: '0', costPerUnit: '0',
}

export default function Stock() {
  const { employee } = useAuth()
  const { data: stockItems, mutate: refetch } = useApi<StockItem[]>('/api/v1/stock')

  const [category, setCategory] = useState('All Categories')
  const [showAddItem, setShowAddItem] = useState(false)
  const [stockInItem, setStockInItem] = useState<StockItem | null>(null)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [stockInQty, setStockInQty] = useState('')
  const [stockInRef, setStockInRef] = useState('')
  const [stockInNotes, setStockInNotes] = useState('')

  const filtered = useMemo(() => {
    if (!stockItems) return []
    return stockItems.filter((s) => category === 'All Categories' || s.category === category)
  }, [category, stockItems])

  const totalValue = stockItems?.reduce((s, i) => s + i.currentQuantity * i.costPerUnit, 0) || 0
  const lowStockCount = stockItems?.filter((s) => s.availableQuantity <= s.minimumLevel).length || 0

  const canWrite = employee?.designation === 'CEO' || employee?.designation === 'Warehouse Maintenance'

  async function submitAddItem(e: React.FormEvent) {
    e.preventDefault()
    await apiClient('/api/v1/stock', {
      method: 'POST',
      body: JSON.stringify({
        productName: itemForm.productName,
        category: itemForm.category,
        brand: itemForm.brand || undefined,
        model: itemForm.model || undefined,
        unit: itemForm.unit,
        currentQuantity: Number(itemForm.currentQuantity),
        minimumLevel: Number(itemForm.minimumLevel),
        costPerUnit: Number(itemForm.costPerUnit),
      }),
    })
    await refetch()
    setShowAddItem(false)
    setItemForm(emptyItemForm)
  }

  async function submitStockIn(e: React.FormEvent) {
    e.preventDefault()
    if (!stockInItem || !stockInQty) return
    await apiClient(`/api/v1/stock/${stockInItem.id}/stock-in`, {
      method: 'POST',
      body: JSON.stringify({
        quantity: Number(stockInQty),
        reference: stockInRef || undefined,
        notes: stockInNotes || undefined,
      }),
    })
    await refetch()
    setStockInItem(null)
    setStockInQty('')
    setStockInRef('')
    setStockInNotes('')
  }

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
    { header: '', cell: (s) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {s.availableQuantity <= s.minimumLevel && <AlertTriangle size={14} className="text-rose" />}
        {canWrite && (
          <button onClick={() => setStockInItem(s)} className="text-xs text-teal hover:underline whitespace-nowrap flex items-center gap-1">
            <PackagePlus size={11} /> Stock In
          </button>
        )}
      </div>
    ) },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Warehouse"
        title="Stock"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">{filtered.length} of {stockItems.length} items</span>
            {canWrite && (
              <button onClick={() => setShowAddItem(true)} className="flex items-center gap-1 bg-sun text-ink text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sun-deep transition-colors">
                <Plus size={13} /> Add Item
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Total Inventory Value" value={formatINR(totalValue)} accent="sun" />
        <KpiCard label="Items Below Minimum" value={String(lowStockCount)} accent="rose" />
        <KpiCard label="Categories Tracked" value={String(CATEGORIES.length)} accent="teal" />
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
            {canWrite && (
              <button onClick={() => setStockInItem(s)} className="text-xs text-teal hover:underline">+ Stock In</button>
            )}
          </Card>
        )}
      />

      {/* Add Item Modal */}
      {showAddItem && (
        <Modal title="Add Stock Item" onClose={() => setShowAddItem(false)} wide>
          <form onSubmit={submitAddItem} className="grid sm:grid-cols-2 gap-4">
            <Field label="Product Name">
              <input required className={inputCls} value={itemForm.productName} onChange={(e) => setItemForm({ ...itemForm, productName: e.target.value })} placeholder="e.g. Mono PERC Solar Panel 540W" />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <input className={inputCls} value={itemForm.brand} onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })} placeholder="e.g. Waaree" />
            </Field>
            <Field label="Model">
              <input className={inputCls} value={itemForm.model} onChange={(e) => setItemForm({ ...itemForm, model: e.target.value })} placeholder="e.g. WS-540" />
            </Field>
            <Field label="Unit">
              <input className={inputCls} value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="Nos / Kg / Mtrs" />
            </Field>
            <Field label="Opening Quantity">
              <input type="number" min={0} className={inputCls} value={itemForm.currentQuantity} onChange={(e) => setItemForm({ ...itemForm, currentQuantity: e.target.value })} />
            </Field>
            <Field label="Minimum Level">
              <input type="number" min={0} className={inputCls} value={itemForm.minimumLevel} onChange={(e) => setItemForm({ ...itemForm, minimumLevel: e.target.value })} />
            </Field>
            <Field label="Cost Per Unit (₹)">
              <input type="number" min={0} className={inputCls} value={itemForm.costPerUnit} onChange={(e) => setItemForm({ ...itemForm, costPerUnit: e.target.value })} />
            </Field>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddItem(false)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-sun text-ink text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sun-deep transition-colors">Add Item</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock In Modal */}
      {stockInItem && (
        <Modal title={`Stock In — ${stockInItem.productName}`} onClose={() => setStockInItem(null)}>
          <form onSubmit={submitStockIn} className="space-y-4">
            <p className="text-xs text-text-dim">Current stock: <span className="text-text font-medium">{stockInItem.currentQuantity} {stockInItem.unit}</span></p>
            <Field label={`Quantity to Add (${stockInItem.unit})`}>
              <input required type="number" min={1} className={inputCls} value={stockInQty} onChange={(e) => setStockInQty(e.target.value)} placeholder="e.g. 10" />
            </Field>
            <Field label="Reference / Invoice No.">
              <input className={inputCls} value={stockInRef} onChange={(e) => setStockInRef(e.target.value)} placeholder="e.g. INV-2024-001" />
            </Field>
            <Field label="Notes">
              <textarea className={inputCls} rows={2} value={stockInNotes} onChange={(e) => setStockInNotes(e.target.value)} placeholder="Optional" />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setStockInItem(null)} className="text-xs text-text-dim px-3 py-2">Cancel</button>
              <button type="submit" className="bg-teal text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Add Stock</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
