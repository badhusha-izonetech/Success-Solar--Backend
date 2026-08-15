import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { useApi } from '../api/hooks'
import { Card, SectionHeading } from '../components/shared/Primitives'
import { formatINR } from '../lib/utils'

export default function Reports() {
  const { data: reportData } = useApi<any>('/api/v1/reports')

  if (!reportData) return <div className="p-8 text-center text-text-dim text-sm">Loading reports...</div>
  
  const thisMonthTotal = reportData.monthlyVerifiedCollections[reportData.monthlyVerifiedCollections.length - 1]?.value || 0

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Executive" title="Reports" />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <SectionHeading eyebrow="Trend" title="Verified collections (6 months)" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={reportData.monthlyVerifiedCollections}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#97a3b3', fontSize: 11 }} />
              <YAxis tick={{ fill: '#97a3b3', fontSize: 11 }} tickFormatter={(v) => `${v / 100000}L`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ background: '#1c2530', border: '1px solid #2a3542', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#f2a93b" strokeWidth={2} dot={{ fill: '#f2a93b', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-text-dim mt-2">Verified this month: {formatINR(thisMonthTotal)}</div>
        </Card>

        <Card className="p-4">
          <SectionHeading eyebrow="Geography" title="Project value by area" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={reportData.projectValueByArea} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#97a3b3', fontSize: 11 }} tickFormatter={(v) => `${v / 100000}L`} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#97a3b3', fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ background: '#1c2530', border: '1px solid #2a3542', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#2fb8a8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <SectionHeading eyebrow="Accounts" title="Payments by verification state" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reportData.paymentTotalByState}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#97a3b3', fontSize: 11 }} />
              <YAxis tick={{ fill: '#97a3b3', fontSize: 11 }} tickFormatter={(v) => `${v / 100000}L`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ background: '#1c2530', border: '1px solid #2a3542', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#e2635f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <p className="text-xs text-text-dim">{reportData.wonLeadCount} leads converted to active projects to date. Full report export and date-range comparison will be added once backend reporting endpoints are available.</p>
    </div>
  )
}
