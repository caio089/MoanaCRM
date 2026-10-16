'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

export interface BarItem { nome: string; valor: number }

interface Props {
  titulo: string
  dados: BarItem[]
  isMonetary?: boolean
}

const GRAD_START = 'rgb(var(--secondary-rgb))'
const GRAD_END   = 'rgb(var(--primary-rgb))'

function fmt(v: number, monetary: boolean) {
  if (monetary)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
    }).format(v)
  return v.toLocaleString('pt-BR')
}

function Tip({ active, payload, label, isMonetary }: {
  active?: boolean; payload?: { value: number }[]; label?: string; isMonetary?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-primary/15 bg-surface-low px-3 py-2 text-label-sm shadow-lg">
      <p className="text-on-surface-variant mb-1">{label}</p>
      <p className="text-primary font-semibold">{fmt(payload[0].value, !!isMonetary)}</p>
    </div>
  )
}

export function GraficoBarrasH({ titulo, dados, isMonetary = false }: Props) {
  const gradId = `h-${titulo.replace(/\W/g, '').slice(0, 20)}`
  const height = Math.max(160, dados.length * 40)

  if (dados.length === 0) {
    return (
      <div className="card flex min-w-0 flex-col">
        <p className="mb-4 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{titulo}</p>
        <p className="text-label-md text-on-surface-variant text-center py-8">Sem dados</p>
      </div>
    )
  }

  return (
    <div className="card flex min-w-0 flex-col">
      <p className="mb-4 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{titulo}</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="vertical"
          data={dados}
          margin={{ left: 4, right: 48, top: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={GRAD_START} />
              <stop offset="100%" stopColor={GRAD_END}   />
            </linearGradient>
          </defs>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="nome"
            width={72}
            tick={{ fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 9) + '…' : v}
          />
          <Tooltip
            content={<Tip isMonetary={isMonetary} />}
            cursor={{ fill: 'rgb(var(--on-surface-rgb) / 0.05)' }}
          />
          <Bar dataKey="valor" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'rgb(var(--on-surface-variant-rgb))', fontSize: 11, formatter: (v: unknown) => fmt(Number(v ?? 0), isMonetary) }}>
            {dados.map((_, i) => (
              <Cell key={i} fill={`url(#${gradId})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
