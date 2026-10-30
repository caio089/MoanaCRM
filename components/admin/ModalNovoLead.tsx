'use client'

import { useState } from 'react'
import type { Lead } from '@/lib/types'
import { ORIGENS } from '@/lib/constants/origens'
import { TIPOS_OPERACAO, etapasPorOperacao, type TipoOperacao } from '@/lib/constants/operacao'

interface ModalNovoLeadProps {
  lead?: Lead | null
  onSave: (dados: Record<string, unknown>) => void
  onClose: () => void
}

export function ModalNovoLead({ lead, onSave, onClose }: ModalNovoLeadProps) {
  const [formData, setFormData] = useState({
    nome: lead?.nome || '',
    cpf: lead?.cpf || '',
    telefone: lead?.telefone || '',
    cidade: lead?.cidade || '',
    zona: lead?.zona || '',
    etapa: lead?.etapa || 'lead',
    corretor: lead?.corretor || '',
    coordenador: lead?.coordenador || '',
    construtora: lead?.construtora || '',
    origem: lead?.origem || '',
    vgv: lead?.vgv ? Number(lead.vgv) : '',
    tipoOperacao: (lead?.tipoOperacao || '') as TipoOperacao | '',
  })

  const [erros, setErros] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (erros[name]) {
      setErros(prev => {
        const novoErros = { ...prev }
        delete novoErros[name]
        return novoErros
      })
    }
  }

  const validar = (): boolean => {
    const novosErros: Record<string, string> = {}

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório'
    } else if (formData.nome.trim().length < 3) {
      novosErros.nome = 'Nome deve ter pelo menos 3 caracteres'
    }

    const cpfDigits = formData.cpf.replace(/\D/g, '')
    if (cpfDigits && cpfDigits.length !== 11) {
      novosErros.cpf = 'CPF deve ter 11 dígitos'
    }

    if (formData.vgv !== '' && Number(formData.vgv) < 0) {
      novosErros.vgv = 'VGV não pode ser negativo'
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validar()) {
      onSave(formData)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 sm:rounded-lg sm:p-6">
        <h2 className="text-xl font-bold text-on-surface mb-4">
          {lead ? '✏️ Editar Lead' : '➕ Novo Lead'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Nome *</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-surface-high text-on-surface ${
                erros.nome ? 'border-error' : 'border-outline'
              }`}
              placeholder="João Silva"
            />
            {erros.nome && <p className="text-label-sm text-error mt-1">{erros.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded bg-surface-high text-on-surface ${
                  erros.cpf ? 'border-error' : 'border-outline'
                }`}
                placeholder="123.456.789-00"
              />
              {erros.cpf && <p className="text-label-sm text-error mt-1">{erros.cpf}</p>}
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
                placeholder="(11) 98765-4321"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Cidade</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Zona</label>
              <input
                type="text"
                name="zona"
                value={formData.zona}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
                placeholder="Zona Leste"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Tipo de Operação</label>
            <div className="flex gap-2">
              {TIPOS_OPERACAO.map((op) => {
                const active = formData.tipoOperacao === op.value
                return (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoOperacao: op.value as TipoOperacao }))}
                    className={`flex-1 px-3 py-2 rounded border text-sm font-medium transition ${
                      active
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-outline bg-surface-high text-on-surface hover:bg-outline/20'
                    }`}
                  >
                    {op.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Etapa</label>
            <select
              name="etapa"
              value={formData.etapa}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
            >
              {etapasPorOperacao(formData.tipoOperacao || 'venda').map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Corretor</label>
              <input
                type="text"
                name="corretor"
                value={formData.corretor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
              />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Coordenador</label>
              <input
                type="text"
                name="coordenador"
                value={formData.coordenador}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Construtora</label>
            <input
              type="text"
              name="construtora"
              value={formData.construtora}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">Origem</label>
              <select
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-outline rounded bg-surface-high text-on-surface"
              >
                <option value="">Selecione</option>
                {ORIGENS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">VGV</label>
              <input
                type="number"
                name="vgv"
                value={formData.vgv}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded bg-surface-high text-on-surface ${
                  erros.vgv ? 'border-error' : 'border-outline'
                }`}
                placeholder="450000"
              />
              {erros.vgv && <p className="text-label-sm text-error mt-1">{erros.vgv}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-outline/30 text-on-surface rounded font-medium hover:bg-outline/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary/90"
            >
              {lead ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
