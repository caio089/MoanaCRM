'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BarChartComponentProps {
  data: any[]
  title: string
  dataKey: string
  height?: number
  horizontal?: boolean
}

const tooltipStyle = {
  backgroundColor: 'rgb(var(--surface-container-rgb))',
  border: '1px solid rgba(226,200,163,0.18)',
  borderRadius: 12,
  color: 'rgb(var(--on-surface-rgb))',
}

export function BarChartComponent({
  data,
  title,
  dataKey,
  height = 300,
  horizontal = false,
}: BarChartComponentProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-4 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{title}</h3>
        <div className="flex h-[300px] items-center justify-center text-on-surface-variant">
          Sem dados para exibir
        </div>
      </div>
    )
  }

  return (
    <div className="card min-w-0">
      <h3 className="mb-4 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: horizontal ? 100 : 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(243,238,234,0.06)" />
          <XAxis type={horizontal ? 'number' : 'category'} stroke="transparent" tick={{ fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11 }} />
          <YAxis type={horizontal ? 'category' : 'number'} dataKey="name" stroke="transparent" tick={{ fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(226,200,163,0.08)' }} />
          <Bar dataKey={dataKey} fill="rgb(var(--primary-rgb))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
