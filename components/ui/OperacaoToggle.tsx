'use client'

import { TIPOS_OPERACAO, type TipoOperacao } from '@/lib/constants/operacao'

type OperacaoToggleProps = {
  value: TipoOperacao
  onChange: (value: TipoOperacao) => void
  required?: boolean
}

/** Alterna Venda / Aluguel. O pipeline e os campos do lead acompanham o valor. */
export function OperacaoToggle({ value, onChange, required = false }: OperacaoToggleProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-label-sm text-on-surface-variant">
        Tipo de operação{required ? ' *' : ''}
      </legend>
      <div className="flex flex-wrap gap-2">
        {TIPOS_OPERACAO.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value as TipoOperacao)}
              className={`chip ${active ? 'chip-active' : ''}`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
