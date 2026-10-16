'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TimelineChartProps {
  data: any[]
  title: string
  height?: number
}

const tooltipStyle = {
  backgroundColor: 'rgb(var(--surface-container-rgb))',
  border: '1px solid rgba(217,189,132,0.18)',
  borderRadius: 14,
  color: 'rgb(var(--on-surface-rgb))',
  boxShadow: '0 18px 45px rgba(0,0,0,.35)',
}

export function TimelineChart({ data, title }: TimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-4 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{title}</h3>
        <div className="flex h-[220px] items-center justify-center text-on-surface-variant sm:h-[300px]">
          Sem dados para exibir
        </div>
      </div>
    )
  }

  return (
    <div className="card card-interactive min-w-0">
      <h3 className="mb-4 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{title}</h3>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="rgba(245,241,232,0.055)" />
            <XAxis dataKey="name" stroke="transparent" tick={{ fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11 }} />
            <YAxis stroke="transparent" width={36} tick={{ fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(226,200,163,0.25)' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="rgb(var(--primary-rgb))"
              dot={{ fill: 'rgb(var(--primary-rgb))', r: 3, stroke: 'rgb(var(--surface-container-rgb))', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: 'rgb(var(--on-surface-rgb))', stroke: 'rgb(var(--primary-rgb))', strokeWidth: 2 }}
              strokeWidth={2.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
