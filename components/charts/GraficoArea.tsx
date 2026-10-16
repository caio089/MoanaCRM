'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Serie {
  key: string
  label: string
  cor: string
}

interface GraficoAreaProps {
  dados: Record<string, string | number>[]
  series: Serie[]
  titulo: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container border border-outline-variant rounded-md px-3 py-2 text-label-sm shadow-lg">
      <p className="text-on-surface-variant mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  )
}

export function GraficoArea({ dados, series, titulo }: GraficoAreaProps) {
  return (
    <div className="card min-w-0">
      <h3 className="text-label-md text-on-surface-variant mb-4">{titulo}</h3>
      <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.cor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.cor} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--on-surface-rgb) / 0.08)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: 'rgb(var(--on-surface-variant-rgb))', paddingTop: '8px' }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.cor}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 4, fill: s.cor }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
