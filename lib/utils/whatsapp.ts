/**
 * Normaliza telefone para wa.me (E.164 sem "+").
 * Aceita formatos com máscara, telefones nacionais (com/sem DDI 55)
 * e telefones internacionais (ex: Holanda +31..., EUA +1...).
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null

  const trimmed = phone.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return null

  // Se o telefone foi digitado com prefixo internacional "+" explícito
  if (trimmed.startsWith('+')) {
    return digits.length >= 7 && digits.length <= 16 ? digits : null
  }

  // Se o número começa com 55 (Brasil) e tem 12 ou 13 dígitos
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits
  }

  // DDD (2 dígitos) + número brasileiro (8 ou 9 dígitos) -> adiciona DDI 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  // Demais números internacionais sem o "+", caso já tenham DDI e entre 12 e 16 dígitos
  if (digits.length >= 12 && digits.length <= 16) {
    return digits
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
