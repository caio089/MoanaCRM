'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FormField } from './FormField'

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string
  error?: string
  required?: boolean
  /** Data em formato ISO (YYYY-MM-DD) ou DD/MM/AAAA */
  value?: string | null
  onChange?: (e: { target: { name?: string; value: string } }) => void
}

/** Converte YYYY-MM-DD para DD/MM/AAAA */
export function isoToBrDate(iso?: string | null): string {
  if (!iso) return ''
  const trimmed = String(iso).trim()
  if (!trimmed) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, y, m, d] = match
    return `${d}/${m}/${y}`
  }
  return trimmed
}

/** Converte DD/MM/AAAA para YYYY-MM-DD */
export function brDateToIso(br?: string | null): string {
  if (!br) return ''
  const trimmed = String(br).trim()
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) {
    const [, d, m, y] = match
    return `${y}-${m}-${d}`
  }
  return trimmed
}

/** Aplica máscara DD/MM/AAAA enquanto o usuário digita */
export function formatBrDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      error,
      required,
      value,
      onChange,
      name,
      className,
      placeholder = 'DD/MM/AAAA',
      ...props
    },
    ref,
  ) => {
    const [displayValue, setDisplayValue] = useState(() => isoToBrDate(value))
    const hiddenDateInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      setDisplayValue(isoToBrDate(value))
    }, [value])

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatBrDateInput(e.target.value)
      setDisplayValue(formatted)

      if (formatted.length === 10) {
        const iso = brDateToIso(formatted)
        onChange?.({ target: { name, value: iso } })
      } else if (formatted.length === 0) {
        onChange?.({ target: { name, value: '' } })
      }
    }

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const pickedIso = e.target.value
      setDisplayValue(isoToBrDate(pickedIso))
      onChange?.({ target: { name, value: pickedIso } })
    }

    const openCalendarPicker = () => {
      const el = hiddenDateInputRef.current
      if (el) {
        try {
          if (typeof (el as any).showPicker === 'function') {
            (el as any).showPicker()
          } else {
            el.focus()
          }
        } catch {
          el.focus()
        }
      }
    }

    const inputElement = (
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          name={name}
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          maxLength={10}
          className={`w-full pr-11 px-4 py-3 ${className || ''}`}
          {...props}
        />
        {/* Input de data nativo oculto para abrir o calendário nativo com clique */}
        <input
          ref={hiddenDateInputRef}
          type="date"
          tabIndex={-1}
          value={brDateToIso(displayValue)}
          onChange={handlePickerChange}
          className="sr-only pointer-events-none"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={openCalendarPicker}
          title="Abrir calendário"
          className="absolute right-3 p-1.5 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-white/5"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    )

    if (!label) {
      return (
        <div>
          {inputElement}
          {error && <span className="text-label-sm text-error mt-1 block">{error}</span>}
        </div>
      )
    }

    return (
      <FormField label={label} error={error} required={required}>
        {inputElement}
      </FormField>
    )
  },
)

DateInput.displayName = 'DateInput'
