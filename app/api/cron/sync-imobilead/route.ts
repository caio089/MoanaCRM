import { NextRequest, NextResponse } from 'next/server'
import { syncImobiLeadData } from '@/lib/services/imobilead'

// Vercel Cron Job - roda a cada hora
// Documentação: https://vercel.com/docs/cron-jobs

export async function GET(request: NextRequest) {
  // Verificar se a requisição vem do Vercel Cron
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    console.log('Iniciando cron job de sincronização ImobileLead...')

    const result = await syncImobiLeadData()

    return NextResponse.json(
      {
        success: true,
        message: 'Sincronização concluída',
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro no cron job:', error)

    return NextResponse.json(
      {
        error: 'Erro ao sincronizar',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
