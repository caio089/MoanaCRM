import type { ReactNode } from 'react'

function formatValue(value: number, tipo: 'numero' | 'moeda' | 'percentual'): string {
  if (tipo === 'moeda') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value)
  }
  if (tipo === 'percentual') {
    return `${value.toFixed(1)}%`
  }
  return new Intl.NumberFormat('pt-BR').format(value)
}

interface KpiCardProps {
  titulo: string
  valor: number
  tipo?: 'numero' | 'moeda' | 'percentual'
  variacao?: number
  subtitulo?: string
  accentColor?: string
  icon?: ReactNode
}

export function KpiCard({
  titulo,
  valor,
  tipo = 'numero',
  variacao,
  subtitulo,
  accentColor = 'text-primary',
  icon,
}: KpiCardProps) {
  const variacaoPositiva = variacao !== undefined && variacao >= 0

  return (
    <div className="card card-interactive group relative flex min-h-[168px] flex-col justify-between gap-4 overflow-hidden">
      <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/[0.05] blur-2xl transition group-hover:bg-primary/[0.09]" />
      <div className="flex items-start justify-between">
        <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">{titulo}</p>
        {icon && <span className={`${accentColor} opacity-70`}>{icon}</span>}
      </div>

      <p data-numeric className={`font-display text-[2.4rem] font-medium leading-none tracking-[-0.045em] sm:text-[3rem] ${accentColor}`}>
        {formatValue(valor, tipo)}
      </p>

      <div className="flex items-center gap-2">
        {variacao !== undefined && (
          <span className={`flex items-center gap-0.5 text-label-sm font-semibold ${variacaoPositiva ? 'text-tertiary' : 'text-error'}`}>
            {variacaoPositiva ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            {Math.abs(variacao).toFixed(1)}%
          </span>
        )}
        {subtitulo && <p className="text-label-sm text-on-surface-variant">{subtitulo}</p>}
      </div>
    </div>
  )
}
