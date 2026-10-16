const IMOBILEAD_API = 'https://integration.imobilead.me/v1/primelead-integration-webhook/callback'
const IMOBILEAD_TOKEN = process.env.IMOBILEAD_API_TOKEN

export interface ImobileLead {
  id: string
  nome?: string
  telefone?: string
  email?: string
  etapa?: string
  valor_imovel?: number
  [key: string]: any
}

export async function processImobiLeadWebhook(data: ImobileLead) {
  try {
    // Mapear campos do ImobileLead para nosso schema
    const mappedLead = {
      id_imobilead: data.id,
      nome: data.nome || '',
      telefone: data.telefone || '',
      email: data.email || '',
      etapa_funil: mapEtapa(data.etapa),
      valor_imovel: data.valor_imovel || 0,
      dados_brutos: data, // Guardar dados originais para referência
      sincronizado_em: new Date().toISOString(),
    }

    return mappedLead
  } catch (error) {
    console.error('Erro ao processar webhook ImobileLead:', error)
    throw error
  }
}

function mapEtapa(etapaImobilead?: string): string {
  // Mapear etapas do ImobileLead para nosso sistema
  const etapaMap: Record<string, string> = {
    'novo': 'Lead',
    'lead': 'Lead',
    'em_analise': 'Análise',
    'qualificado': 'Aprovado',
    'descartado': 'Reprovado',
    // Adicionar mais mapeamentos conforme necessário
  }

  return etapaImobilead ? (etapaMap[etapaImobilead.toLowerCase()] || 'Lead') : 'Lead'
}

export async function notifyImobilead(leadId: string, updates: Partial<ImobileLead>) {
  if (!IMOBILEAD_TOKEN) {
    console.warn('IMOBILEAD_API_TOKEN não configurado')
    return
  }

  try {
    const url = `${IMOBILEAD_API}/${leadId}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMOBILEAD_TOKEN}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`ImobileLead API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao notificar ImobileLead:', error)
    // Não falhar a aplicação se a notificação falhar
    return null
  }
}

export async function syncImobiLeadData() {
  // Função para sincronização periódica (usada pelo cron job)
  try {
    console.log('Iniciando sincronização com ImobileLead...')
    // Implementar lógica de sincronização conforme necessário
    return { success: true }
  } catch (error) {
    console.error('Erro ao sincronizar ImobileLead:', error)
    throw error
  }
}
