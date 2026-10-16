'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ConfirmDeleteModalProps = {
  title?: string
  itemName?: string
  description?: string
  confirming?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

/**
 * Modal de confirmação via portal no body — evita ficar preso em cards
 * com backdrop-filter/overflow (que quebram position:fixed e fazem
 * o botão Confirmar cair em cima do Deletar no mobile).
 */
export function ConfirmDeleteModal({
  title = 'Excluir lead?',
  itemName,
  description = 'Tem certeza que deseja deletar este lead? Esta ação não pode ser desfeita.',
  confirming = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [mounted, setMounted] = useState(false)
  // Impede toque acidental no Confirmar logo após abrir (mesmo gesto do Deletar)
  const [confirmReady, setConfirmReady] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setConfirmReady(false)
    const t = window.setTimeout(() => setConfirmReady(true), 350)
    return () => window.clearTimeout(t)
  }, [itemName])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirming) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [confirming, onCancel])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={() => !confirming && onCancel()}
    >
      <div
        className="overlay-shadow w-full max-w-sm rounded-t-3xl border border-white/10 bg-[#1a1f26] p-6 sm:rounded-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-delete-title" className="mb-2 text-headline-sm text-on-surface">
          {title}
        </h3>
        {itemName ? (
          <p className="mb-2 text-body-md font-medium text-on-surface">{itemName}</p>
        ) : null}
        <p className="mb-6 text-body-md text-on-surface-variant">{description}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 rounded-lg border border-outline px-4 py-2.5 text-on-surface hover:bg-white/5 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={confirming || !confirmReady}
            className="flex-1 rounded-lg bg-error px-4 py-2.5 text-on-error hover:bg-error/90 disabled:opacity-40"
          >
            {confirming ? 'Excluindo…' : 'Confirmar exclusão'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
