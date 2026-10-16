/**
 * Normaliza telefone BR para wa.me (E.164 sem "+").
 * Aceita formatos com máscara, com/sem DDI 55.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null

  let digits = phone.replace(/\D/g, '')
  if (!digits) return null

  // Remove zeros à esquerda comuns em exports
  digits = digits.replace(/^0+/, '')

  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return digits
  }

  // DDD (2) + número (8 ou 9)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return null
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const number = toWhatsAppNumber(phone)
  if (!number) return null

  const url = new URL(`https://wa.me/${number}`)
  if (message?.trim()) {
    url.searchParams.set('text', message.trim())
  }
  return url.toString()
}

export function defaultWhatsAppMessage(nome?: string | null): string {
  const firstName = nome?.trim().split(/\s+/)[0]
  if (firstName) {
    return `Olá ${firstName}! Sou da equipe Construtora Moana. Como posso ajudar?`
  }
  return 'Olá! Sou da equipe Construtora Moana. Como posso ajudar?'
}
