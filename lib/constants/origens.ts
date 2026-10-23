/** Origens comerciais pré-cadastradas (selects e filtros). */
export const ORIGENS = [
  { value: 'Tráfego', label: 'Tráfego' },
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Google', label: 'Google' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Site', label: 'Site' },
  { value: 'Captação pessoal', label: 'Captação pessoal' },
  { value: 'Indicação', label: 'Indicação' },
  { value: 'Plantão', label: 'Plantão' },
  { value: 'Imoblead', label: 'Imoblead' },
  { value: 'Portal', label: 'Portal (ZAP/OLX)' },
  { value: 'Evento', label: 'Evento' },
  { value: 'Outros', label: 'Outros' },
] as const

export const ORIGEM_VALUES = ORIGENS.map((o) => o.value)

export type OrigemValue = (typeof ORIGENS)[number]['value']
