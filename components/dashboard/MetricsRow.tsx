'use client'

import React from 'react'

interface Metric {
  label: string
  value: number | string
  format?: 'number' | 'currency' | 'percentage'
  icon?: React.ReactNode
}

interface MetricsRowProps {
  metrics: Metric[]
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value
    if (format === 'currency') {
      return `R$ ${new Intl.NumberFormat('pt-BR').format(value)}`
    }
    if (format === 'percentage') {
      return `${value}%`
    }
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  return (
    <div className={`grid gap-4 ${
      metrics.length <= 1
        ? 'grid-cols-1'
        : metrics.length === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : metrics.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    }`}>
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="card card-interactive group relative flex min-h-[150px] flex-col justify-between overflow-hidden"
        >
          <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <span className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/[0.055] blur-2xl transition group-hover:bg-primary/[0.09]" />
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">{metric.label}</h3>
            {metric.icon && <div className="text-primary opacity-70">{metric.icon}</div>}
          </div>
          <div data-numeric className="font-display text-[2.4rem] font-medium leading-none tracking-[-0.045em] text-on-surface sm:text-[3rem]">
            {formatValue(metric.value, metric.format)}
          </div>
        </div>
      ))}
    </div>
  )
}
