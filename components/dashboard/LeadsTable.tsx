'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import type { Lead } from '@/lib/types'

interface LeadsTableProps {
  leads: Lead[]
  columns: {
    key: keyof Lead | string
    label: string
    format?: (value: any) => string
  }[]
  onRowClick?: (lead: Lead) => void
  onEdit?: (lead: Lead) => void
  onDelete?: (lead: Lead) => void | Promise<void>
  isLoading?: boolean
  totalItems: number
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function LeadsTable({
  leads,
  columns,
  onRowClick,
  onEdit,
  onDelete,
  isLoading = false,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
}: LeadsTableProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState(false)
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const openLead = (lead: Lead) => {
    if (onRowClick) onRowClick(lead)
    else if (lead.id) router.push(`/clientes/${encodeURIComponent(lead.id)}`)
  }

  const formatCellValue = (value: any, format?: (v: any) => string) => {
    if (format) return format(value)
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
    if (typeof value === 'number') return new Intl.NumberFormat('pt-BR').format(value)
    if (value instanceof Date) return new Intl.DateTimeFormat('pt-BR').format(value)
    return String(value)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return
    try {
      setDeleting(true)
      await onDelete(deleteTarget)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const deleteModal = deleteTarget ? (
    <ConfirmDeleteModal
      itemName={deleteTarget.nome}
      confirming={deleting}
      onCancel={() => !deleting && setDeleteTarget(null)}
      onConfirm={confirmDelete}
    />
  ) : null

  if (isLoading) {
    return (
      <>
        <div className="card space-y-3 py-6" role="status" aria-live="polite">
          <span className="sr-only">Carregando dados</span>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
          ))}
        </div>
        {deleteModal}
      </>
    )
  }

  if (leads.length === 0) {
    return (
      <>
        <div className="card py-10 text-center" role="status">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl text-primary">⌕</div>
          <p className="font-medium text-on-surface">Nenhum resultado encontrado</p>
          <p className="mt-1 text-label-md text-on-surface-variant">Tente ajustar ou limpar os filtros selecionados.</p>
        </div>
        {deleteModal}
      </>
    )
  }

  return (
    <>
    <div className="card overflow-hidden p-3 sm:p-5">
      <div className="space-y-3 md:hidden">
        {leads.map((lead, idx) => (
          <article
            key={lead.id || idx}
            className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4 transition hover:border-primary/15 hover:bg-white/[0.035] active:scale-[0.99]"
            onClick={() => openLead(lead)}
            onKeyDown={(event) => {
              if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) openLead(lead)
            }}
            role="link"
            tabIndex={0}
          >
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={String(col.key)} className="flex items-start justify-between gap-3">
                  <span className="text-label-sm text-on-surface-variant">{col.label}</span>
                  <span className="max-w-[60%] text-right text-label-md text-on-surface">
                    {formatCellValue((lead as any)[col.key as keyof Lead], col.format)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant pt-3">
              <WhatsAppButton
                telefone={lead.telefone}
                nome={lead.nome}
                variant="chip"
                label="WhatsApp"
                className="min-h-10 flex-1 justify-center"
              />
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(lead)
                  }}
                  className="min-h-10 flex-1 rounded bg-primary/20 px-3 text-label-sm text-primary"
                >
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(lead)
                  }}
                  className="min-h-10 flex-1 rounded bg-error/20 px-3 text-label-sm text-error"
                >
                  Deletar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="table-scroll hidden md:block">
        <table className="w-full min-w-[640px]" aria-label="Lista de leads">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-label-md text-primary font-semibold">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, idx) => (
              <tr
                key={lead.id || idx}
                onClick={() => openLead(lead)}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) openLead(lead)
                }}
                className="cursor-pointer border-b border-white/[0.045] transition-colors last:border-0 hover:bg-primary/[0.035]"
                role="link"
                tabIndex={0}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-4 text-label-md text-on-surface/90">
                    {col.key === 'telefone' && lead.telefone ? (
                      <div className="flex items-center gap-2">
                        <span>{formatCellValue((lead as any)[col.key as keyof Lead], col.format)}</span>
                        <WhatsAppButton telefone={lead.telefone} nome={lead.nome} variant="icon" />
                      </div>
                    ) : (
                      formatCellValue((lead as any)[col.key as keyof Lead], col.format)
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-label-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <WhatsAppButton
                      telefone={lead.telefone}
                      nome={lead.nome}
                      variant="chip"
                      label="WhatsApp"
                    />
                    {onEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(lead)
                        }}
                        className="px-3 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-label-sm"
                      >
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(lead)
                        }}
                        className="px-3 py-1 rounded bg-error/20 text-error hover:bg-error/30 transition-colors text-label-sm"
                      >
                        Deletar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 mt-4 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-label-sm text-on-surface-variant">
            {totalItems > 0
              ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems}`
              : '0 resultados'}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="min-h-10 rounded border border-outline px-3 py-2 text-label-sm text-on-surface disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface-high"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-label-sm text-on-surface-variant">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="min-h-10 rounded border border-outline px-3 py-2 text-label-sm text-on-surface disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface-high"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

    </div>
    {deleteModal}
    </>
  )
}
