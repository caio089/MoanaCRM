'use client'

import React from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({
  label,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {error && <span className="text-label-sm text-error">{error}</span>}
    </div>
  )
}

interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, required, ...props }, ref) => (
    <FormField label={label} error={error} required={required}>
      <input
        ref={ref}
        className="w-full px-4 py-3"
        {...props}
      />
    </FormField>
  )
)

TextInput.displayName = 'TextInput'

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  required?: boolean
  options: Array<{ value: string; label: string }>
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, ...props }, ref) => (
    <FormField label={label} error={error} required={required}>
      <select
        ref={ref}
        className="w-full px-4 py-3"
        {...props}
      >
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  )
)

Select.displayName = 'Select'

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  required?: boolean
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, required, ...props }, ref) => (
    <FormField label={label} error={error} required={required}>
      <textarea
        ref={ref}
        className="w-full resize-none px-4 py-3"
        rows={4}
        {...props}
      />
    </FormField>
  )
)

TextArea.displayName = 'TextArea'

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, ...props }, ref) => (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className="w-5 h-5 rounded border-outline-variant accent-primary"
          {...props}
        />
        <span className="text-label-md text-on-surface">{label}</span>
      </label>
      {error && <span className="text-label-sm text-error">{error}</span>}
    </div>
  )
)

Checkbox.displayName = 'Checkbox'
