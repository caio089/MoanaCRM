import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/auth/session'
import { getUserRole } from '@/lib/auth/map-user'
import { createClient } from '@/lib/supabase/server'

/** Diagnóstico read-only via sessão do admin (sem SERVICE_ROLE). */
export async function POST() {
  const user = await getRequestUser()
  if (!user || getUserRole(user) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: leads, error } = await supabase.from('leads').select('id, etapa, vgv')

    if (error) throw error

    const list = leads ?? []
    const leadsRealizados = list.filter((lead) => lead.etapa === 'realizado')
    const leadsComVgvZero = list.filter((lead) => !lead.vgv || Number(lead.vgv) === 0)

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Diagnóstico Supabase (somente leitura).',
      resultados: {
        total: list.length,
        realizados: leadsRealizados.length,
        vgvVazio: leadsComVgvZero.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
