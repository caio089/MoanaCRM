'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface Item {
  nome: string
  valor: number
  cor?: string
}

interface GraficoBarrasProps {
  dados: Item[]
  titulo: string
  corPadrao?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-low border border-primary/15 rounded-xl px-3 py-2 text-label-sm shadow-lg">
      <p className="text-on-surface-variant mb-1">{label}</p>
      <p className="text-primary font-semibold">{payload[0].value.toLocaleString('pt-BR')}</p>
    </div>
  )
}

export function GraficoBarras({ dados, titulo, corPadrao = 'rgb(var(--primary-rgb))' }: GraficoBarrasProps) {
  return (
    <div className="card min-w-0">
      <h3 className="mb-4 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{titulo}</h3>
      <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--on-surface-rgb) / 0.08)" vertical={false} />
          <XAxis
            dataKey="nome"
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--on-surface-rgb) / 0.05)' }} />
          <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
            {dados.map((entry, index) => (
              <Cell key={index} fill={entry.cor ?? corPadrao} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
