'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PageHeading } from '@/components/ui/PageHeading'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { getLeadById } from '@/lib/services/leads'
import { formatBRL } from '@/lib/formatters'
import {
  CATEGORIAS_IMOVEL,
  MODALIDADES,
  TIPOS_IMOVEL,
  optionLabel,
} from '@/lib/constants/lead-options'
import type { Lead } from '@/lib/types'

const EditLeadModal = dynamic(
  () => import('@/components/leads/EditLeadModal').then((module) => module.EditLeadModal),
  { ssr: false },
)

const ETAPA_LABELS: Record<string, string> = {
  lead: 'Novo lead',
  analise: 'Em análise',
  aprovado: 'Aprovado',
  visita: 'Visita',
  especulativo: 'Especulativo',
  realizado: 'Realizado',
  reprovado: 'Reprovado',
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] px-4 py-3.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/55">{label}</p>
      <div className="mt-1.5 break-words text-body-md text-on-surface">{value || 'Não informado'}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="mb-4 text-headline-sm text-on-surface">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}

export default function ClientePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  const loadLead = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setLead(await getLeadById(decodeURIComponent(params.id)))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o cliente.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadLead()
  }, [loadLead])

  if (loading) {
    return <div className="page-section"><div className="card animate-pulse py-16 text-center text-on-surface-variant">Carregando informações do cliente…</div></div>
  }

  if (!lead || error) {
    return (
      <div className="page-section">
        <div className="card py-12 text-center">
          <h1 className="text-headline-sm text-on-surface">Cliente não encontrado</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">{error || 'Este cadastro não está mais disponível.'}</p>
          <Link href="/leads" className="btn-primary mt-6 inline-flex">Voltar para leads</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-section">
      <PageHeading
        eyebrow="Ficha do cliente"
        title={lead.nome}
        description={`Cadastro ${lead.id} · atualizado em ${formatDate(lead.atualizadoEm)}`}
        actions={(
          <>
            <button type="button" onClick={() => router.back()} className="chip">← Voltar</button>
            <WhatsAppButton telefone={lead.telefone} nome={lead.nome} label="Mandar mensagem" />
            <button type="button" onClick={() => setEditing(true)} className="btn-primary">Editar cliente</button>
          </>
        )}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <div className="card bg-gradient-to-br from-primary/[0.09] to-transparent">
          <p className="eyebrow">Status comercial</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-label-md font-semibold text-primary">
              {ETAPA_LABELS[lead.etapa] || lead.etapa}
            </span>
            <span className="text-body-md text-on-surface-variant">{lead.origem || 'Origem não informada'}</span>
          </div>
        </div>
        <div className="card">
          <p className="text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">VGV</p>
          <p data-numeric className="mt-2 font-display text-3xl text-on-surface">{formatBRL(lead.vgv)}</p>
        </div>
      </div>

      <Section title="Contato e identificação">
        <InfoItem label="Nome completo" value={lead.nome} />
        <InfoItem label="CPF" value={lead.cpf} />
        <InfoItem
          label="Telefone"
          value={
            lead.telefone ? (
              <div className="flex flex-wrap items-center gap-2">
                <a href={`tel:${lead.telefone}`} className="text-primary hover:underline">
                  {lead.telefone}
                </a>
                <WhatsAppButton telefone={lead.telefone} nome={lead.nome} variant="chip" label="Mandar mensagem" />
              </div>
            ) : null
          }
        />
        <InfoItem label="E-mail" value={lead.email ? <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a> : null} />
        <InfoItem label="Cidade" value={lead.cidade} />
        <InfoItem label="Bairro" value={lead.bairro} />
        <InfoItem label="Zona" value={lead.zona} />
      </Section>

      <Section title="Responsáveis e origem">
        <InfoItem label="Corretor" value={lead.corretor} />
        <InfoItem label="Coordenador" value={lead.coordenador} />
        <InfoItem label="Construtora" value={lead.construtora} />
        <InfoItem label="Correspondente" value={lead.correspondente} />
        <InfoItem label="Origem" value={lead.origem} />
        <InfoItem label="ID Imobilead" value={lead.idImobilead} />
      </Section>

      <Section title="Imóvel e financeiro">
        <InfoItem label="Produto / empreendimento" value={lead.produto} />
        <InfoItem label="Modalidade do imóvel" value={optionLabel(CATEGORIAS_IMOVEL, lead.categoriaImovel)} />
        <InfoItem label="Tipo de imóvel" value={optionLabel(TIPOS_IMOVEL, lead.tipoImovel)} />
        <InfoItem label="Modalidade de financiamento" value={optionLabel(MODALIDADES, lead.modalidade)} />
        <InfoItem label="Valor de avaliação" value={formatBRL(lead.valorAvaliacao)} />
        <InfoItem label="Valor de fechamento" value={formatBRL(lead.valorFecho)} />
        <InfoItem label="CHB" value={formatBRL(lead.chb)} />
        <InfoItem label="Faturamento previsto" value={formatBRL(lead.faturamentoPrevisto)} />
      </Section>

      <Section title="Renda e processo">
        <InfoItem label="Tipo de renda" value={lead.tipoRenda} />
        <InfoItem label="Comprovação" value={lead.comprovacao} />
        <InfoItem label="CCV" value={lead.ccv ? 'Sim' : 'Não'} />
        <InfoItem label="Situação da reprovação" value={lead.situacaoReprovado} />
        <InfoItem label="Criado em" value={formatDate(lead.criadoEm)} />
        <InfoItem label="Atualizado em" value={formatDate(lead.atualizadoEm)} />
      </Section>

      <section className="card">
        <h2 className="text-headline-sm text-on-surface">Observações</h2>
        <p className="mt-3 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface-variant">{lead.observacao || 'Nenhuma observação registrada.'}</p>
      </section>

      {editing && (
        <EditLeadModal
          isOpen
          leadId={lead.id}
          onClose={() => setEditing(false)}
          onSuccess={() => {
            setEditing(false)
            loadLead()
          }}
        />
      )}
    </div>
  )
}
