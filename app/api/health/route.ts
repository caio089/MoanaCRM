import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAnonClient()

    // Ping via RPC SECURITY DEFINER (anon não vê leads por RLS — count 0 não significa vazio).
    const { error } = await supabase.rpc('resolve_correspondente_nome', {
      p_nome: '__health_ping__',
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      status: 'ok',
      database: 'supabase',
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { status: 'error', database: 'unavailable' },
      { status: 503 },
    )
  }
}
