'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MoanaLogo } from '@/components/brand/MoanaLogo'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/visao')
    }
  }, [user, loading, router])

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
    setEmail('')
    setPassword('')
    setNome('')
    setShowPassword(false)
  }

  /** Garante linha em corretores caso o trigger do Auth não rode (fallback). */
  async function ensureCorretorProfile(userId: string, nomeCorretor: string, emailCorretor: string) {
    const existing = await supabase.from('corretores').select('id').eq('user_id', userId).limit(1)
    if (existing.error) return
    if (Array.isArray(existing.data) && existing.data.length > 0) return

    await supabase.from('corretores').insert({
      nome: nomeCorretor,
      email: emailCorretor,
      user_id: userId,
      ativo: true,
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        const nomeTrim = nome.trim()
        if (nomeTrim.length < 2) {
          setError('Informe seu nome completo.')
          return
        }
        if (password.length < 6) {
          setError('A senha precisa ter pelo menos 6 caracteres.')
          return
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          options: {
            data: { name: nomeTrim, nome: nomeTrim, role: 'corretor' },
          },
        })

        if (authError) {
          setError(authError.message)
          return
        }

        const createdUser = data.user
        if (!createdUser) {
          setError('Não foi possível criar a conta. Tente novamente.')
          return
        }

        // Sem sessão = confirmação de e-mail ativada no projeto
        if (!data.session) {
          setInfo('Conta criada. Confirme o e-mail (se solicitado) e faça login. Você já aparece em Corretores.')
          setMode('login')
          setPassword('')
          return
        }

        await ensureCorretorProfile(createdUser.id, nomeTrim, email.trim().toLowerCase())
        window.location.assign('/visao')
        return
      }

      const emailNorm = email.trim().toLowerCase()
      const passwordNorm = password.trim()

      if (!emailNorm || !passwordNorm) {
        setError('Informe e-mail e senha.')
        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password: passwordNorm,
      })

      if (authError) {
        const msg = authError.message.toLowerCase()
        if (msg.includes('invalid') || msg.includes('credentials')) {
          setError('E-mail ou senha incorretos. Verifique as credenciais e tente novamente.')
        } else if (msg.includes('rate') || msg.includes('too many')) {
          setError('Muitas tentativas. Aguarde 1 minuto e tente de novo.')
        } else {
          setError(authError.message)
        }
        return
      }

      if (!data?.session && !data?.user) {
        setError('Login sem sessão. Tente novamente em instantes.')
        return
      }

      // Full navigation evita corrida: ProtectedRoute via sem cookie e volta ao login
      window.location.assign('/visao')
    } catch {
      setError(mode === 'signup' ? 'Não foi possível criar a conta.' : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-on-surface-variant">Preparando o ambiente…</p>
        </div>
      </div>
    )
  }

  const isSignup = mode === 'signup'

  return (
    <main className="relative grid min-h-dvh overflow-hidden lg:grid-cols-[1.05fr_.95fr]">
      <ThemeToggle compact className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 bg-surface-lowest/80 shadow-sm backdrop-blur-xl" />
      <section className="relative hidden overflow-hidden border-r border-white/[0.06] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div aria-hidden="true" className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary/[0.09] blur-[110px]" />
        <div className="brand-panel relative self-start rounded-2xl px-4 py-3">
          <MoanaLogo variant="red" width={190} height={68} className="h-14 w-auto object-contain" priority />
        </div>
        <div className="relative max-w-xl pb-10">
          <p className="eyebrow">Inteligência comercial</p>
          <h1 className="text-balance font-display text-[4.6rem] font-medium leading-[.9] tracking-[-0.052em] text-on-surface xl:text-[5.65rem]">
            Decisões que transformam oportunidades em lares.
          </h1>
          <p className="mt-7 max-w-md text-body-lg text-on-surface-variant">
            Uma visão precisa do seu funil, da primeira conversa à realização de cada venda.
          </p>
        </div>
        <p className="relative text-[10px] uppercase tracking-[0.24em] text-on-surface-variant/45">Construtora Moana · CRM comercial</p>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8">
      <div aria-hidden="true" className="absolute right-[5%] top-[12%] h-64 w-64 rounded-full bg-secondary/[0.07] blur-3xl" />
      <div className="card relative w-full max-w-md border-primary/10 p-7 sm:p-10">
        <div className="mb-8 text-center">
          <div className="brand-panel mx-auto w-fit rounded-2xl px-4 py-2.5 lg:hidden">
            <MoanaLogo
              variant="red"
              width={176}
              height={72}
              className="h-[3.65rem] w-auto object-contain"
              priority
            />
          </div>
          <p className="eyebrow mt-6 justify-center">Acesso reservado</p>
          <h2 className="font-display text-[2.55rem] font-medium leading-none tracking-[-0.045em] text-on-surface">
            {isSignup ? 'Criar conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {isSignup
              ? 'Cadastre-se como corretor e entre na equipe automaticamente.'
              : 'Acesse sua central de inteligência comercial.'}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
              !isSignup ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
              isSignup ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label htmlFor="nome" className="mb-1.5 block text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                autoComplete="name"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="w-full px-4 py-3"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3"
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 pr-12"
                aria-invalid={Boolean(error)}
                required
                minLength={isSignup ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant/70 transition hover:text-primary"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-error/15 bg-error/10 px-3 py-2.5 text-label-md text-error">
              {error}
            </p>
          )}

          {info && (
            <p role="status" className="rounded-xl border border-primary/15 bg-primary/10 px-3 py-2.5 text-label-md text-primary">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary min-h-12 w-full"
          >
            {submitting
              ? isSignup
                ? 'Criando conta…'
                : 'Entrando…'
              : isSignup
                ? 'Criar conta de corretor'
                : 'Entrar'}
          </button>
        </form>
      </div>
      </section>
    </main>
  )
}
