import type { ReactNode } from 'react'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  keyFn: (row: T) => string
  onRowClick?: (row: T) => void
  mobileCard: (row: T) => ReactNode
}

export function DataTable<T>({ columns, rows, keyFn, onRowClick, mobileCard }: DataTableProps<T>) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel-raised text-text-dim text-[11px] uppercase tracking-wide">
              {columns.map((c) => (
                <th key={c.header} className={`text-left font-medium px-4 py-3 whitespace-nowrap ${c.className ?? ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyFn(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-t border-border bg-panel ${onRowClick ? 'cursor-pointer hover:bg-panel-raised' : ''} transition-colors`}
              >
                {columns.map((c) => (
                  <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="py-10 text-center text-text-dim text-sm">No records match the current filters.</div>
        )}
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <div key={keyFn(row)} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : ''}>
            {mobileCard(row)}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="py-10 text-center text-text-dim text-sm">No records match the current filters.</div>
        )}
      </div>
    </>
  )
}
