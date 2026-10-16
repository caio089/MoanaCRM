import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/auth/session'

export async function GET() {
  const user = await getRequestUser()
  return NextResponse.json({ session: user ? { user } : null })
}
