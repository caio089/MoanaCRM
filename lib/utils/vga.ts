/** VGA — Valor Global de Avaliação (locação). Equivalente do VGV. */

export type VgaInput = {
  valorAvaliacao?: number | null
  valorLocacaoMensal?: number | null
  prazoContratoMeses?: number | null
}

export type VgaResumo = {
  avaliacao: number
  locacaoMensal: number
  prazoMeses: number
  receitaProjetada: number
  rentabilidadeBruta: number | null
}

const DEFAULT_PRAZO = 12

function toMoney(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function calcularVga(input: VgaInput): VgaResumo {
  const avaliacao = toMoney(input.valorAvaliacao)
  const locacaoMensal = toMoney(input.valorLocacaoMensal)
  const prazoRaw = toMoney(input.prazoContratoMeses)
  const prazoMeses = prazoRaw > 0 ? prazoRaw : DEFAULT_PRAZO
  const receitaProjetada = locacaoMensal * prazoMeses
  const rentabilidadeBruta = avaliacao > 0 ? (receitaProjetada / avaliacao) * 100 : null

  return {
    avaliacao,
    locacaoMensal,
    prazoMeses,
    receitaProjetada,
    rentabilidadeBruta,
  }
}
