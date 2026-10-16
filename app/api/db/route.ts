import { NextResponse } from 'next/server'

/**
 * Legado: QueryBuilder agora fala direto com o Supabase.
 * Mantido só para não quebrar clientes antigos.
 */
export async function POST() {
  return NextResponse.json(
    {
      data: null,
      error: {
        message: 'Endpoint /api/db descontinuado. Use o client Supabase direto.',
      },
      count: null,
    },
    { status: 410 },
  )
}
