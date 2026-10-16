'use client'

interface AnalysisCardProps {
  title: string
  data: Array<{
    label: string
    value: number | string
  }>
  variant?: 'quantity' | 'currency'
}

export function AnalysisCard({
  title,
  data,
  variant = 'quantity',
}: AnalysisCardProps) {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1)

  return (
    <div className="card card-interactive">
      <h3 className="mb-5 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{title}</h3>
      <div className="space-y-4">
        {data.slice(0, 5).map((item, idx) => (
          <div key={idx}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="max-w-[68%] truncate text-label-md text-on-surface">{item.label}</span>
              <span className="font-display text-lg leading-none text-primary">
                {variant === 'currency' && typeof item.value === 'number'
                  ? `R$ ${new Intl.NumberFormat('pt-BR').format(item.value)}`
                  : item.value}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.055]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/45 via-primary/75 to-primary shadow-[0_0_10px_rgba(217,189,132,.18)]"
                style={{ width: `${Math.min((Number(item.value) / max) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
