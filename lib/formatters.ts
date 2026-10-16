export const mascaraCPF = (): string => '***.***.***-**'

export function formatData(iso: string): string {
  const d = new Date(iso)
  const m = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
  return `${String(d.getDate()).padStart(2,'0')} DE ${m[d.getMonth()]}. DE ${d.getFullYear()}`
}

export function formatBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function formatBRLCompact(v: number | null | undefined): string {
  if (v == null || v === 0) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
  }).format(v)
}
