/** Opções dos selects do formulário de lead (criar e editar). */
export type LeadOption = { value: string; label: string }

export const ETAPAS: LeadOption[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'analise', label: 'Análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'especulativo', label: 'Especulativo' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'visita', label: 'Visita' },
]

export const ZONAS: LeadOption[] = [
  { value: 'norte', label: 'Zona Norte' },
  { value: 'sul', label: 'Zona Sul' },
  { value: 'leste', label: 'Zona Leste' },
  { value: 'sudeste', label: 'Zona Sudeste' },
  { value: 'oeste', label: 'Zona Oeste' },
  { value: 'centro', label: 'Centro' },
]

export const TIPOS_IMOVEL: LeadOption[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'industrial', label: 'Industrial' },
]

/** Modalidade do imóvel (aba Imóvel). */
export const CATEGORIAS_IMOVEL: LeadOption[] = [
  { value: 'imovel_novo', label: 'Imóvel Novo' },
  { value: 'imovel_usado', label: 'Imóvel Usado' },
  { value: 'aquisicao_construcao', label: 'Aquisição e Construção' },
  { value: 'empreendimento', label: 'Empreendimento' },
]

/** Modalidade de financiamento (aba Financeiro). */
export const MODALIDADES: LeadOption[] = [
  { value: 'mcmv', label: 'MCMV' },
  { value: 'sbpe', label: 'SBPE' },
  { value: 'direto', label: 'Direto' },
  { value: 'financiamento', label: 'Financiamento' },
]

export const TIPOS_RENDA: LeadOption[] = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'informal', label: 'Informal' },
  { value: 'aposentado', label: 'Aposentado' },
  { value: 'autônomo', label: 'Autônomo' },
]

export const COMPROVACOES: LeadOption[] = [
  { value: 'contracheque', label: 'Contracheque' },
  { value: 'declaracao', label: 'Declaração' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'extrato', label: 'Extrato' },
  { value: 'outro', label: 'Outro' },
]

/** Rótulo amigável de um valor salvo (ex.: 'imovel_novo' → 'Imóvel Novo'). */
export function optionLabel(options: LeadOption[], value: string | null | undefined): string | null {
  if (!value) return null
  return options.find((option) => option.value === value.toLowerCase())?.label ?? value
}
