/**
 * Credenciais públicas do Supabase (URL + anon/publishable key).
 * Lança erro cedo se o ambiente estiver incompleto.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou PUBLISHABLE_KEY) no ambiente.',
    )
  }

  return { url, anonKey }
}
